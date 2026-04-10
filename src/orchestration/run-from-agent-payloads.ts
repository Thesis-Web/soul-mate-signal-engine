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
import { normalizeAgentPayloads } from '../ingestion/normalize-agent-payload.js';
import type { AgentPayload } from '../types/agent-payload.js';
import type { OpenerPackEntry, ProfessionalReportContract, ReviewLog } from '../types/artifacts.js';
import type {
  AuditedSignal,
  CandidateMatch,
  DimensionScores,
  OutputLanguagePolicy,
  RankedMatch,
  ScoringConfig,
  SubjectProfile,
} from '../index.js';

function clampScore(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value * 100) / 100;
}

function mapHumorResonance(
  subjectHumor: SubjectProfile['humor_style'],
  signal: AuditedSignal,
): number {
  if (subjectHumor === 'dry' && signal.communication_style === 'thoughtful') return 78;
  if (subjectHumor === 'dry' && signal.communication_style === 'playful') return 66;
  if (subjectHumor === 'wholesome' && signal.communication_style === 'supportive') return 82;
  return 60;
}

function mapValuesAlignment(candidate: CandidateMatch, signal: AuditedSignal): number {
  const base =
    45 + candidate.matched_interests.length * 10 + candidate.community_overlap_signals.length * 8;
  if (signal.availability_signal === 'available') return clampScore(base + 10);
  if (signal.availability_signal === 'unclear') return clampScore(base);
  return clampScore(base - 25);
}

function mapRelationshipCompatibility(subject: SubjectProfile, signal: AuditedSignal): number {
  const subjectHasIntent = subject.relationship_signals.length > 0;

  if (!subjectHasIntent) return 40;
  if (signal.romantic_fit_status === 'not_aligned') return 0;
  if (signal.romantic_fit_status === 'aligned' && signal.availability_signal === 'available')
    return 84;
  if (signal.romantic_fit_status === 'aligned' && signal.availability_signal === 'unclear')
    return 58;
  return 34;
}

function mapEmotionalToneFit(subject: SubjectProfile, signal: AuditedSignal): number {
  if (subject.emotional_tone === 'optimistic' && signal.communication_style === 'thoughtful') {
    return 76;
  }
  if (subject.emotional_tone === 'optimistic' && signal.communication_style === 'playful') {
    return 72;
  }
  if (subject.emotional_tone === 'melancholic' && signal.communication_style === 'supportive') {
    return 78;
  }
  return 64;
}

function mapCommunityAdjacency(candidate: CandidateMatch): number {
  return clampScore(
    candidate.community_overlap_signals.length * 25 + candidate.matched_interests.length * 8,
  );
}

function mapReciprocityProbability(signal: AuditedSignal): number {
  const sparkBonus = signal.spark_indicators.length * 8;
  if (signal.romantic_fit_status === 'not_aligned') return 0;
  if (signal.romantic_fit_status === 'aligned' && signal.availability_signal === 'available') {
    return clampScore(58 + sparkBonus);
  }
  if (signal.romantic_fit_status === 'aligned' && signal.availability_signal === 'unclear') {
    return clampScore(42 + sparkBonus);
  }
  if (signal.availability_signal === 'available') return clampScore(42 + sparkBonus);
  if (signal.availability_signal === 'unclear') return clampScore(28 + sparkBonus);
  return 0;
}

function mapEvidenceStrength(candidate: CandidateMatch, signal: AuditedSignal): number {
  return clampScore((candidate.evidence_items.length + signal.evidence_items.length) * 35);
}

function mapRecencyStrength(candidate: CandidateMatch, signal: AuditedSignal): number {
  const candidateHasObservedAt = candidate.evidence_items.some((item) => Boolean(item.observed_at));
  const signalHasObservedAt = signal.evidence_items.some((item) => Boolean(item.observed_at));
  if (candidateHasObservedAt || signalHasObservedAt) return 85;
  return 70;
}

function mapCautionBand(signal: AuditedSignal): RankedMatch['caution_band'] {
  if (
    signal.disqualifier_flags.length > 0 ||
    signal.availability_signal === 'unavailable' ||
    signal.romantic_fit_status === 'not_aligned'
  ) {
    return 'high';
  }
  if (
    signal.caution_flags.length > 0 ||
    signal.availability_signal === 'unclear' ||
    signal.romantic_fit_status === 'unknown'
  ) {
    return 'moderate';
  }
  return 'low';
}

function buildExplanation(
  subject: SubjectProfile,
  candidate: CandidateMatch,
  signal: AuditedSignal,
): string {
  const interests = candidate.matched_interests.slice(0, 3).join(', ');
  const romanticFitClause =
    signal.romantic_fit_status === 'aligned'
      ? 'Romantic fit has some explicit evidence support.'
      : 'Romantic fit remains unverified and should not be inferred.';
  return `Signal-based romantic match with probable overlap in ${interests}. Communication appears ${signal.communication_style} and the subject cadence looks compatible with ${subject.cadence_summary}. ${romanticFitClause} Requires human judgment.`;
}

function buildOpener(candidate: CandidateMatch): string {
  const topInterest = candidate.matched_interests[0] ?? 'your recent post';
  return `Your post about ${topInterest} caught my eye - what pulled you into that space?`;
}

function buildDimensionScores(
  subject: SubjectProfile,
  candidate: CandidateMatch,
  signal: AuditedSignal,
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
  };
}

function buildOutputBrief(input: {
  runId: string;
  subjectProfile: SubjectProfile;
  rankedMatches: RankedMatch[];
}): string {
  const lines = [
    `# Output Brief - ${input.runId}`,
    '',
    `Subject: @${input.subjectProfile.handle}`,
    '',
    '## Ranked Matches',
    '',
  ];

  if (input.rankedMatches.length === 0) {
    lines.push('No candidates met the current ingest criteria.');
    return `${lines.join('\n')}\n`;
  }

  for (const match of input.rankedMatches) {
    lines.push(`### ${match.rank}. @${match.handle} - ${match.compatibility_score}`);
    lines.push('');
    lines.push(`- Caution band: ${match.caution_band}`);
    lines.push(`- Evidence strength: ${match.evidence_strength}`);
    lines.push(`- Recency strength: ${match.recency_strength}`);
    lines.push(`- Explanation: ${match.explanation}`);
    lines.push(`- Opener: ${match.opener_suggestion}`);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function buildOpenerPack(rankedMatches: RankedMatch[]): OpenerPackEntry[] {
  return rankedMatches.map((match) => ({
    rank: match.rank,
    handle: match.handle,
    opener_suggestion: match.opener_suggestion,
    caution_band: match.caution_band,
  }));
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

export async function runFromAgentPayloads(input: {
  runId: string;
  createdAt: string;
  payloadPaths: string[];
  outputDir: string;
  scoringConfig: ScoringConfig;
  outputLanguagePolicy: OutputLanguagePolicy;
  professionalReportContract: ProfessionalReportContract;
}): Promise<{
  outputDir: string;
  rankedMatches: RankedMatch[];
}> {
  if (input.payloadPaths.length === 0) {
    throw new Error('At least one payload path is required.');
  }

  const payloads = await Promise.all(
    input.payloadPaths.map((payloadPath) => readJsonFile<AgentPayload>(payloadPath)),
  );

  const normalized = normalizeAgentPayloads(payloads);
  const subjectProfile = normalized.subject_profile;
  const candidatePool = normalized.candidate_pool;
  const auditedSignalSet = normalized.audited_signal_set;
  const auditedByHandle = new Map(auditedSignalSet.map((item) => [item.handle, item]));

  const rankedMatches = candidatePool
    .map((candidate) => {
      const signal = auditedByHandle.get(candidate.handle);

      if (!signal) {
        return null;
      }

      if (
        signal.disqualifier_flags.length > 0 ||
        signal.availability_signal === 'unavailable' ||
        signal.romantic_fit_status === 'not_aligned'
      ) {
        return null;
      }

      const dimensionScores = buildDimensionScores(subjectProfile, candidate, signal);
      const uncertaintyPenalty =
        signal.caution_flags.length > 0 || signal.romantic_fit_status === 'unknown' ? 6 : 3;
      const compatibilityScore = computeWeightedScore(
        dimensionScores,
        input.scoringConfig,
        uncertaintyPenalty,
      );
      const evidenceStrength = mapEvidenceStrength(candidate, signal);
      const recencyStrength = mapRecencyStrength(candidate, signal);
      const cautionBand = mapCautionBand(signal);
      const explanation = buildExplanation(subjectProfile, candidate, signal);
      const openerSuggestion = buildOpener(candidate);

      assertAllowedOutputLanguage(explanation, input.outputLanguagePolicy);
      assertAllowedOutputLanguage(openerSuggestion, input.outputLanguagePolicy);

      const sourceLinks = [
        ...candidate.evidence_items.map((item) => item.source_reference),
        ...signal.evidence_items.map((item) => item.source_reference),
      ];

      return {
        handle: candidate.handle,
        compatibility_score: compatibilityScore,
        dimension_scores: dimensionScores,
        evidence_strength: evidenceStrength,
        recency_strength: recencyStrength,
        caution_band: cautionBand,
        explanation,
        opener_suggestion: openerSuggestion,
        source_links: [...new Set(sourceLinks)],
      };
    })
    .filter((item): item is Omit<RankedMatch, 'rank'> => item !== null)
    .sort((a, b) => b.compatibility_score - a.compatibility_score)
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  const reviewLog: ReviewLog = buildReviewLog({
    run_id: input.runId,
    created_at: input.createdAt,
    notes: [
      'Public-signal romantic-compatibility output generated from normalized external agent payloads.',
    ],
    caution_summary: rankedMatches
      .filter((item) => item.caution_band !== 'low')
      .map((item) => `@${item.handle}: caution band ${item.caution_band}`),
    unknown_summary: [
      'Relationship certainty remains out of scope; outputs are advisory only.',
      'The engine does not infer attraction preference or orientation from ambiguity.',
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
    payload_agents: payloads.map((payload) => payload.agent_id),
    subject_profile: subjectProfile,
    ranked_matches: rankedMatches,
    review_log: reviewLog,
    contract: input.professionalReportContract,
  });

  const professionalReportJsonPath = path.join(input.outputDir, '09-professional-report.json');
  const professionalReportMarkdownPath = path.join(input.outputDir, '10-professional-report.md');
  const professionalReportPdfPath = path.join(input.outputDir, '11-professional-report.pdf');

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
          emitted_required_artifacts: artifactManifest.artifacts
            .filter((item) => item.requirement_level === 'required')
            .map((item) => item.file_name),
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
  ]);

  for (const [fileName, content] of writes.entries()) {
    await writeFile(path.join(input.outputDir, fileName), content, 'utf8');
  }

  await renderProfessionalReportPdf({
    reportJsonPath: professionalReportJsonPath,
    outputPdfPath: professionalReportPdfPath,
  });

  return {
    outputDir: input.outputDir,
    rankedMatches,
  };
}
