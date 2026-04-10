import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assertAllowedOutputLanguage,
  buildProfessionalReport,
  buildReviewLog,
  buildRunArtifactManifest,
  computeWeightedScore,
  renderProfessionalReportMarkdown,
  renderProfessionalReportPdf,
} from '../index.js';
import { makeDebugLog } from '../lib/debug-log.js';
import { normalizeAgentPayloads } from '../ingestion/normalize-agent-payload.js';
import type { AgentPayload } from '../types/agent-payload.js';
import type { OpenerPackEntry, ProfessionalReportContract, ReviewLog } from '../types/artifacts.js';
import type {
  AuditedSignal,
  CandidateMatch,
  DimensionScores,
  GenderSignal,
  OrientationSignal,
  OutputLanguagePolicy,
  RankedMatch,
  ScoringConfig,
  SubjectProfile,
} from '../index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clampScore(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value * 100) / 100;
}

// ─── Orientation alignment ─────────────────────────────────────────────────────

function computeOrientationAlignment(
  subjectOrientation: OrientationSignal = 'unknown',
  subjectGender: GenderSignal = 'unknown',
  candidateOrientation: OrientationSignal = 'unknown',
  candidateGender: GenderSignal = 'unknown',
): number {
  if (
    subjectOrientation === 'unknown' ||
    subjectGender === 'unknown' ||
    candidateOrientation === 'unknown' ||
    candidateGender === 'unknown'
  ) {
    return 60; // neutral — can't assert mismatch
  }
  if (subjectOrientation === 'bisexual') return 80;

  const subjectSeeks: GenderSignal =
    subjectOrientation === 'straight'
      ? subjectGender === 'male'
        ? 'female'
        : 'male'
      : subjectGender === 'male'
        ? 'male'
        : 'female';

  const candidateSeeks: GenderSignal =
    candidateOrientation === 'bisexual'
      ? subjectGender
      : candidateOrientation === 'straight'
        ? candidateGender === 'male'
          ? 'female'
          : 'male'
        : candidateGender === 'male'
          ? 'male'
          : 'female';

  const subjectWantsCandidateGender = subjectSeeks === candidateGender;
  const candidateWantsSubjectGender = candidateSeeks === subjectGender;

  if (subjectWantsCandidateGender && candidateWantsSubjectGender) return 95;
  if (subjectWantsCandidateGender || candidateWantsSubjectGender) return 50;
  return 10;
}

// ─── Scoring helpers ───────────────────────────────────────────────────────────

function mapHumorResonance(
  subjectHumor: SubjectProfile['humor_style'],
  signal: AuditedSignal,
): number {
  if (subjectHumor === 'dry' && signal.communication_style === 'thoughtful') return 78;
  if (subjectHumor === 'dry' && signal.communication_style === 'playful') return 70;
  if (subjectHumor === 'absurdist' && signal.communication_style === 'playful') return 85;
  if (subjectHumor === 'wholesome' && signal.communication_style === 'supportive') return 82;
  if (subjectHumor === 'self_deprecating' && signal.communication_style === 'playful') return 76;
  if (subjectHumor === 'none') return 55;
  return 60;
}

function mapValuesAlignment(candidate: CandidateMatch, signal: AuditedSignal): number {
  const base =
    45 + candidate.matched_interests.length * 10 + candidate.community_overlap_signals.length * 8;
  if (signal.availability_signal === 'available') return clampScore(base + 8);
  if (signal.availability_signal === 'unclear') return clampScore(base);
  return clampScore(base - 10);
}

function mapRelationshipCompatibility(subject: SubjectProfile, signal: AuditedSignal): number {
  const subjectHasIntent = subject.relationship_signals.length > 0;
  if (!subjectHasIntent) return 40;
  if (signal.romantic_fit_status === 'not_aligned') return 15;
  if (signal.romantic_fit_status === 'aligned' && signal.availability_signal === 'available')
    return 88;
  if (signal.romantic_fit_status === 'aligned' && signal.availability_signal === 'unclear')
    return 62;
  if (signal.romantic_fit_status === 'aligned' && signal.availability_signal === 'unavailable')
    return 48;
  return 36;
}

function mapEmotionalToneFit(subject: SubjectProfile, signal: AuditedSignal): number {
  if (subject.emotional_tone === 'optimistic' && signal.communication_style === 'thoughtful')
    return 76;
  if (subject.emotional_tone === 'optimistic' && signal.communication_style === 'playful')
    return 80;
  if (subject.emotional_tone === 'optimistic' && signal.communication_style === 'supportive')
    return 72;
  if (subject.emotional_tone === 'neutral' && signal.communication_style === 'thoughtful')
    return 70;
  if (subject.emotional_tone === 'melancholic' && signal.communication_style === 'supportive')
    return 78;
  if (subject.emotional_tone === 'venting' && signal.communication_style === 'supportive')
    return 72;
  return 60;
}

function mapCommunityAdjacency(candidate: CandidateMatch): number {
  return clampScore(
    candidate.community_overlap_signals.length * 25 + candidate.matched_interests.length * 8,
  );
}

function mapReciprocityProbability(signal: AuditedSignal): number {
  const sparkBonus = signal.spark_indicators.length * 10;
  if (signal.romantic_fit_status === 'not_aligned') return 12;
  if (signal.romantic_fit_status === 'aligned' && signal.availability_signal === 'available')
    return clampScore(62 + sparkBonus);
  if (signal.romantic_fit_status === 'aligned' && signal.availability_signal === 'unclear')
    return clampScore(44 + sparkBonus);
  if (signal.romantic_fit_status === 'aligned' && signal.availability_signal === 'unavailable')
    return clampScore(28 + sparkBonus);
  if (signal.availability_signal === 'available') return clampScore(40 + sparkBonus);
  if (signal.availability_signal === 'unclear') return clampScore(26 + sparkBonus);
  return clampScore(14 + sparkBonus);
}

function mapEvidenceStrength(candidate: CandidateMatch, signal: AuditedSignal): number {
  return clampScore((candidate.evidence_items.length + signal.evidence_items.length) * 35);
}

function mapRecencyStrength(candidate: CandidateMatch, signal: AuditedSignal): number {
  const hasObservedAt =
    candidate.evidence_items.some((i) => Boolean(i.observed_at)) ||
    signal.evidence_items.some((i) => Boolean(i.observed_at));
  return hasObservedAt ? 85 : 70;
}

function mapCautionBand(
  signal: AuditedSignal,
  orientationScore: number,
): RankedMatch['caution_band'] {
  if (signal.disqualifier_flags.length > 0) return 'high';
  if (orientationScore < 30) return 'high';
  if (
    signal.caution_flags.length > 0 ||
    signal.availability_signal === 'unclear' ||
    signal.romantic_fit_status === 'unknown'
  )
    return 'moderate';
  return 'low';
}

function buildPondStatus(signal: AuditedSignal): string {
  if (signal.availability_signal === 'unavailable') {
    const by = signal.caught_by ? `by @${signal.caught_by}` : 'already';
    return `🎣 Caught ${by} — but catch and release is always possible`;
  }
  if (signal.availability_signal === 'unclear')
    return '🌊 Status unclear — still in the pond, probably';
  return '🐟 Swimming free — pond looks open!';
}

function buildExplanation(
  subject: SubjectProfile,
  candidate: CandidateMatch,
  signal: AuditedSignal,
  orientationScore: number,
): string {
  const interests = candidate.matched_interests.slice(0, 3).join(', ');
  const vibeNote =
    signal.spark_indicators.length > 0
      ? `Sparks detected: ${signal.spark_indicators[0]}.`
      : 'No direct spark signals yet — but vibes can sneak up on you.';
  const availNote =
    signal.availability_signal === 'unavailable'
      ? `⚠ Currently off the market${signal.caught_by ? ` (with @${signal.caught_by})` : ''} — feelings are complicated though.`
      : '';
  const orientNote =
    orientationScore < 40
      ? '⚠ Orientation signals suggest this might not be a natural fit — trust the data.'
      : '';

  return [
    `Probable vibe overlap around: ${interests || 'shared interests'}.`,
    `Communication style is ${signal.communication_style} — pairs ${signal.communication_style === 'playful' ? 'nicely' : 'decently'} with a ${subject.humor_style} sense of humor.`,
    vibeNote,
    availNote,
    orientNote,
  ]
    .filter(Boolean)
    .join(' ');
}

function buildOpener(candidate: CandidateMatch, signal: AuditedSignal): string {
  const topInterest = candidate.matched_interests[0] ?? 'your latest post';
  const spark = signal.spark_indicators[0];
  if (spark)
    return `Saw your post and immediately thought: same. What got you into ${topInterest}?`;
  if (signal.communication_style === 'playful')
    return `Hot take incoming — is ${topInterest} actually underrated? Asking for a friend. (The friend is me.)`;
  if (signal.communication_style === 'thoughtful')
    return `Your take on ${topInterest} stuck with me. What's the angle you think most people miss?`;
  if (signal.communication_style === 'supportive')
    return `You seem genuinely passionate about ${topInterest} — what keeps you coming back to it?`;
  return `Stumbled across your ${topInterest} content and had to ask — what's the story there?`;
}

function buildDimensionScores(
  subject: SubjectProfile,
  candidate: CandidateMatch,
  signal: AuditedSignal,
  orientationScore: number,
): DimensionScores {
  return {
    interest_overlap: clampScore(candidate.interest_overlap_score),
    humor_style_resonance: mapHumorResonance(subject.humor_style, signal),
    values_alignment: mapValuesAlignment(candidate, signal),
    social_tempo: clampScore(signal.energy_level * 10),
    relationship_signal_compatibility: mapRelationshipCompatibility(subject, signal),
    emotional_tone_fit: mapEmotionalToneFit(subject, signal),
    community_adjacency: mapCommunityAdjacency(candidate),
    reciprocity_probability: mapReciprocityProbability(signal),
    orientation_alignment: orientationScore,
  };
}

function buildOutputBrief(input: {
  runId: string;
  subjectProfile: SubjectProfile;
  rankedMatches: RankedMatch[];
}): string {
  const lines = [
    `# 🌊 Soul Mate Signal Engine — Catch Report`,
    ``,
    `**Run:** ${input.runId}`,
    `**Subject:** @${input.subjectProfile.handle}`,
    `**Interests:** ${input.subjectProfile.interests.slice(0, 5).join(', ')}`,
    ``,
    `---`,
    ``,
    `## The Pond`,
    ``,
  ];

  if (input.rankedMatches.length === 0) {
    lines.push(`The pond is quiet today. No candidates cleared the net on this run.`);
    return `${lines.join('\n')}\n`;
  }

  for (const match of input.rankedMatches) {
    lines.push(
      `### ${match.rank}. @${match.handle}  —  Vibe Score: ${match.compatibility_score}/100`,
    );
    lines.push(``);
    lines.push(`**${match.pond_status}**`);
    lines.push(``);
    lines.push(match.explanation);
    lines.push(``);
    lines.push(`> 💬 Opener: *${match.opener_suggestion}*`);
    lines.push(``);
    lines.push(
      `Caution: ${match.caution_band} | Evidence: ${match.evidence_strength} | Recency: ${match.recency_strength}`,
    );
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  lines.push(
    `*All outputs are signal-based, advisory, and require your own good judgment. The engine doesn't know your heart — only you do. 🎣*`,
  );
  return `${lines.join('\n')}\n`;
}

function buildOpenerPack(rankedMatches: RankedMatch[]): OpenerPackEntry[] {
  return rankedMatches.map((match) => ({
    rank: match.rank,
    handle: match.handle,
    opener_suggestion: match.opener_suggestion,
    caution_band: match.caution_band,
    pond_status: match.pond_status,
  }));
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

// ─── Main export ───────────────────────────────────────────────────────────────

export async function runFromAgentPayloads(input: {
  runId: string;
  createdAt: string;
  payloadPaths: string[];
  outputDir: string;
  scoringConfig: ScoringConfig;
  outputLanguagePolicy: OutputLanguagePolicy;
  professionalReportContract: ProfessionalReportContract;
}): Promise<{ outputDir: string; rankedMatches: RankedMatch[] }> {
  const log = makeDebugLog(input.runId);

  log.stage('INGEST');
  if (input.payloadPaths.length === 0) throw new Error('At least one payload path is required.');

  const payloads = await Promise.all(input.payloadPaths.map((p) => readJsonFile<AgentPayload>(p)));
  log.info('INGEST', `loaded ${payloads.length} agent payloads`, {
    agents: payloads.map((p) => p.agent_id),
  });

  log.stage('NORMALIZE');
  const normalized = normalizeAgentPayloads(payloads, input.runId);
  const subjectProfile = normalized.subject_profile;
  const candidatePool = normalized.candidate_pool;
  const auditedSignalSet = normalized.audited_signal_set;
  log.info(
    'NORMALIZE',
    `subject="${subjectProfile.handle}" orientation="${subjectProfile.orientation_signal}" gender="${subjectProfile.gender_signal}"`,
  );
  log.info('NORMALIZE', `${candidatePool.length} candidates in pool`);

  log.stage('AUDIT');
  const auditedByHandle = new Map(auditedSignalSet.map((item) => [item.handle, item]));

  log.stage('SCORE');
  const rankedMatches = candidatePool
    .map((candidate) => {
      const signal = auditedByHandle.get(candidate.handle);
      if (!signal) {
        log.drop(candidate.handle, 'no audited signal found');
        return null;
      }

      if (signal.disqualifier_flags.length > 0) {
        log.drop(candidate.handle, `disqualifier: ${signal.disqualifier_flags.join(', ')}`);
        return null;
      }

      const orientationScore = computeOrientationAlignment(
        subjectProfile.orientation_signal,
        subjectProfile.gender_signal,
        signal.orientation_signal,
        signal.gender_signal,
      );

      log.candidate(
        'SCORE',
        candidate.handle,
        `availability=${signal.availability_signal} orientation_score=${orientationScore} romantic_fit=${signal.romantic_fit_status}`,
      );

      const dimensionScores = buildDimensionScores(
        subjectProfile,
        candidate,
        signal,
        orientationScore,
      );
      const uncertaintyPenalty =
        signal.caution_flags.length > 0 || signal.romantic_fit_status === 'unknown'
          ? 6
          : signal.availability_signal === 'unavailable'
            ? 8
            : 3;
      const compatibilityScore = computeWeightedScore(
        dimensionScores,
        input.scoringConfig,
        uncertaintyPenalty,
      );
      const evidenceStrength = mapEvidenceStrength(candidate, signal);
      const recencyStrength = mapRecencyStrength(candidate, signal);
      const cautionBand = mapCautionBand(signal, orientationScore);
      const pondStatus = buildPondStatus(signal);
      const explanation = buildExplanation(subjectProfile, candidate, signal, orientationScore);
      const openerSuggestion = buildOpener(candidate, signal);

      assertAllowedOutputLanguage(explanation, input.outputLanguagePolicy);

      log.score(candidate.handle, compatibilityScore, compatibilityScore, cautionBand);

      const sourceLinks = [
        ...candidate.evidence_items.map((i) => i.source_reference),
        ...signal.evidence_items.map((i) => i.source_reference),
      ];

      return {
        handle: candidate.handle,
        compatibility_score: compatibilityScore,
        dimension_scores: dimensionScores,
        evidence_strength: evidenceStrength,
        recency_strength: recencyStrength,
        caution_band: cautionBand,
        availability_signal: signal.availability_signal,
        pond_status: pondStatus,
        explanation,
        opener_suggestion: openerSuggestion,
        source_links: [...new Set(sourceLinks)],
      };
    })
    .filter((item): item is Omit<RankedMatch, 'rank'> => item !== null)
    .sort((a, b) => b.compatibility_score - a.compatibility_score)
    .map((item, index) => ({ rank: index + 1, ...item }));

  log.info('SCORE', `scored ${rankedMatches.length} candidates`);
  log.stage('EMIT');

  const reviewLog: ReviewLog = buildReviewLog({
    run_id: input.runId,
    created_at: input.createdAt,
    notes: ['Public-signal compatibility output. Fun and advisory — not a love oracle.'],
    caution_summary: rankedMatches
      .filter((m) => m.caution_band !== 'low')
      .map((m) => `@${m.handle}: ${m.caution_band} — ${m.pond_status}`),
    unknown_summary: [
      'Outputs are advisory. They do not determine love.',
      'Orientation signals used only where explicitly public.',
      'Availability is flavor, not a filter. Catch and release is real.',
    ],
  });

  const artifactManifest = buildRunArtifactManifest({
    run_id: input.runId,
    run_status: 'success',
    created_at: input.createdAt,
  });

  await mkdir(input.outputDir, { recursive: true });

  const professionalReport = buildProfessionalReport({
    run_id: input.runId,
    created_at: input.createdAt,
    payload_agents: payloads.map((p) => p.agent_id),
    subject_profile: subjectProfile,
    ranked_matches: rankedMatches,
    review_log: reviewLog,
    contract: input.professionalReportContract,
  });

  const professionalReportJsonPath = path.join(input.outputDir, '09-professional-report.json');
  const professionalReportMarkdownPath = path.join(input.outputDir, '10-professional-report.md');
  const professionalReportPdfPath = path.join(input.outputDir, '11-professional-report.pdf');

  const debugLines = log.summary();

  const writes = new Map<string, string>([
    ['01-subject-profile.json', JSON.stringify(subjectProfile, null, 2)],
    ['02-candidate-pool.json', JSON.stringify(candidatePool, null, 2)],
    ['03-audited-signal-set.json', JSON.stringify(auditedSignalSet, null, 2)],
    ['04-match-scorecard.json', JSON.stringify(rankedMatches, null, 2)],
    ['05-output-brief.md', buildOutputBrief({ runId: input.runId, subjectProfile, rankedMatches })],
    ['06-review-log.json', JSON.stringify(reviewLog, null, 2)],
    ['07-opener-pack.json', JSON.stringify(buildOpenerPack(rankedMatches), null, 2)],
    [
      '08-run-metrics.json',
      JSON.stringify(
        {
          run_id: input.runId,
          created_at: input.createdAt,
          candidate_count: candidatePool.length,
          ranked_count: rankedMatches.length,
          subject_orientation: subjectProfile.orientation_signal,
          subject_gender: subjectProfile.gender_signal,
          emitted_required_artifacts: artifactManifest.artifacts
            .filter((a) => a.requirement_level === 'required')
            .map((a) => a.file_name),
        },
        null,
        2,
      ),
    ],
    [path.basename(professionalReportJsonPath), JSON.stringify(professionalReport, null, 2)],
    [
      path.basename(professionalReportMarkdownPath),
      renderProfessionalReportMarkdown(professionalReport),
    ],
    ['00-debug.log', debugLines.join('\n') + '\n'],
  ]);

  for (const [fileName, content] of writes.entries()) {
    await writeFile(path.join(input.outputDir, fileName), content, 'utf8');
  }

  await renderProfessionalReportPdf({
    reportJsonPath: professionalReportJsonPath,
    outputPdfPath: professionalReportPdfPath,
  });

  log.info('EMIT', `all artifacts written to ${input.outputDir}`);
  return { outputDir: input.outputDir, rankedMatches };
}
