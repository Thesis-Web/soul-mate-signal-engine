import { normalizeHandle } from '../index.js';
import { makeDebugLog } from '../lib/debug-log.js';
import type { AgentPayload, NormalizedAgentIngestionResult } from '../types/agent-payload.js';
import type {
  GenderSignal,
  OrientationSignal,
  RomanticFitStatus,
} from '../types/runtime-contract.js';

function mergeUnique(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter((v) => v.length > 0))];
}

function mergeRomanticFitStatus(statuses: RomanticFitStatus[]): RomanticFitStatus {
  if (statuses.includes('not_aligned')) return 'not_aligned';
  if (statuses.includes('aligned')) return 'aligned';
  return 'unknown';
}

function mergeOrientationSignal(signals: (OrientationSignal | undefined)[]): OrientationSignal {
  const clean = signals.filter((s): s is OrientationSignal => s !== undefined && s !== 'unknown');
  if (clean.length === 0) return 'unknown';
  // If agents agree, use it. If they disagree, fall back to unknown.
  const unique = [...new Set(clean)];
  return unique.length === 1 ? unique[0]! : 'unknown';
}

function mergeGenderSignal(signals: (GenderSignal | undefined)[]): GenderSignal {
  const clean = signals.filter((s): s is GenderSignal => s !== undefined && s !== 'unknown');
  if (clean.length === 0) return 'unknown';
  const unique = [...new Set(clean)];
  return unique.length === 1 ? unique[0]! : 'unknown';
}

export function normalizeAgentPayloads(
  payloads: AgentPayload[],
  runId = 'unknown',
): NormalizedAgentIngestionResult {
  const log = makeDebugLog(runId);
  log.stage('NORMALIZE');

  if (payloads.length === 0) throw new Error('At least one agent payload is required.');

  const first = payloads[0];
  if (!first) throw new Error('At least one agent payload is required.');

  const subjectHandle = normalizeHandle(first.subject.handle);
  log.info('NORMALIZE', `subject handle resolved to "${subjectHandle}"`);

  const mismatch = payloads.find((p) => normalizeHandle(p.subject.handle) !== subjectHandle);
  if (mismatch) {
    throw new Error(
      `All agent payloads must reference the same subject handle. Got "${mismatch.subject.handle}".`,
    );
  }

  const subjectOrientation = mergeOrientationSignal(
    payloads.map((p) => p.subject.orientation_signal),
  );
  const subjectGender = mergeGenderSignal(payloads.map((p) => p.subject.gender_signal));

  log.info('NORMALIZE', `subject orientation="${subjectOrientation}" gender="${subjectGender}"`);

  const subject_profile = {
    handle: subjectHandle,
    profile_bio: payloads.map((p) => p.subject.bio.trim()).find((v) => v.length > 0) ?? '',
    pinned_post_excerpt:
      payloads.map((p) => p.subject.pinned_post_excerpt.trim()).find((v) => v.length > 0) ?? '',
    recent_posts: mergeUnique(payloads.flatMap((p) => p.subject.recent_posts)),
    interests: mergeUnique(payloads.flatMap((p) => p.subject.interests)),
    humor_style: first.subject.humor_style,
    emotional_tone: first.subject.emotional_tone,
    relationship_signals: mergeUnique(payloads.flatMap((p) => p.subject.relationship_signals)),
    cadence_summary:
      payloads.map((p) => p.subject.cadence_summary.trim()).find((v) => v.length > 0) ?? '',
    evidence_items: payloads.flatMap((p) => p.subject.evidence),
    orientation_signal: subjectOrientation,
    gender_signal: subjectGender,
  };

  // Merge candidate data across payloads
  const candidateMap = new Map<
    string,
    {
      matched_interests: string[];
      interest_overlap_scores: number[];
      community_overlap_signals: string[];
      candidate_evidence: (typeof first.candidates)[number]['candidate_evidence'];
      communication_style: (typeof first.candidates)[number]['communication_style'];
      availability_signal: (typeof first.candidates)[number]['availability_signal'];
      caught_by?: string | undefined;
      romantic_fit_statuses: RomanticFitStatus[];
      energy_levels: number[];
      caution_flags: string[];
      disqualifier_flags: string[];
      spark_indicators: string[];
      audit_evidence: (typeof first.candidates)[number]['audit_evidence'];
      orientation_signals: (OrientationSignal | undefined)[];
      gender_signals: (GenderSignal | undefined)[];
    }
  >();

  for (const payload of payloads) {
    for (const candidate of payload.candidates) {
      const handle = normalizeHandle(candidate.handle);
      const romanticFitStatus = candidate.romantic_fit_status ?? 'unknown';
      const existing = candidateMap.get(handle);

      if (!existing) {
        candidateMap.set(handle, {
          matched_interests: [...candidate.matched_interests],
          interest_overlap_scores: [candidate.interest_overlap_score],
          community_overlap_signals: [...candidate.community_overlap_signals],
          candidate_evidence: [...candidate.candidate_evidence],
          communication_style: candidate.communication_style,
          availability_signal: candidate.availability_signal,
          ...(candidate.caught_by !== undefined && { caught_by: candidate.caught_by }),
          romantic_fit_statuses: [romanticFitStatus],
          energy_levels: [candidate.energy_level],
          caution_flags: [...candidate.caution_flags],
          disqualifier_flags: [...candidate.disqualifier_flags],
          spark_indicators: [...candidate.spark_indicators],
          audit_evidence: [...candidate.audit_evidence],
          orientation_signals: [candidate.orientation_signal],
          gender_signals: [candidate.gender_signal],
        });
        log.trace('NORMALIZE', `new candidate "${handle}" from agent "${payload.agent_id}"`);
        continue;
      }

      existing.matched_interests.push(...candidate.matched_interests);
      existing.interest_overlap_scores.push(candidate.interest_overlap_score);
      existing.community_overlap_signals.push(...candidate.community_overlap_signals);
      existing.candidate_evidence.push(...candidate.candidate_evidence);
      existing.romantic_fit_statuses.push(romanticFitStatus);
      existing.energy_levels.push(candidate.energy_level);
      existing.caution_flags.push(...candidate.caution_flags);
      existing.disqualifier_flags.push(...candidate.disqualifier_flags);
      existing.spark_indicators.push(...candidate.spark_indicators);
      existing.audit_evidence.push(...candidate.audit_evidence);
      existing.orientation_signals.push(candidate.orientation_signal);
      existing.gender_signals.push(candidate.gender_signal);

      // Availability: pessimistic merge
      if (
        existing.availability_signal === 'available' &&
        candidate.availability_signal !== 'available'
      ) {
        existing.availability_signal = candidate.availability_signal;
      } else if (
        existing.availability_signal === 'unclear' &&
        candidate.availability_signal === 'unavailable'
      ) {
        existing.availability_signal = 'unavailable';
      }

      // caught_by: take first non-null
      if (!existing.caught_by && candidate.caught_by) {
        existing.caught_by = candidate.caught_by;
      }

      log.trace('NORMALIZE', `merged candidate "${handle}" from agent "${payload.agent_id}"`);
    }
  }

  log.info(
    'NORMALIZE',
    `merged ${candidateMap.size} unique candidates from ${payloads.length} agent payloads`,
  );

  const candidate_pool = [...candidateMap.entries()].map(([handle, value]) => ({
    handle,
    matched_interests: mergeUnique(value.matched_interests),
    interest_overlap_score:
      Math.round(
        (value.interest_overlap_scores.reduce((sum, v) => sum + v, 0) /
          value.interest_overlap_scores.length) *
          100,
      ) / 100,
    community_overlap_signals: mergeUnique(value.community_overlap_signals),
    evidence_items: value.candidate_evidence,
  }));

  const audited_signal_set = [...candidateMap.entries()].map(([handle, value]) => ({
    handle,
    communication_style: value.communication_style,
    availability_signal: value.availability_signal,
    ...(value.caught_by !== undefined && { caught_by: value.caught_by }),
    romantic_fit_status: mergeRomanticFitStatus(value.romantic_fit_statuses),
    energy_level:
      Math.round(
        (value.energy_levels.reduce((sum, v) => sum + v, 0) / value.energy_levels.length) * 100,
      ) / 100,
    caution_flags: mergeUnique(value.caution_flags),
    disqualifier_flags: mergeUnique(value.disqualifier_flags),
    spark_indicators: mergeUnique(value.spark_indicators),
    evidence_items: value.audit_evidence,
    orientation_signal: mergeOrientationSignal(value.orientation_signals),
    gender_signal: mergeGenderSignal(value.gender_signals),
  }));

  log.info('NORMALIZE', `normalization complete`, {
    candidates: candidate_pool.length,
    orientation: subjectOrientation,
    gender: subjectGender,
  });

  return { subject_profile, candidate_pool, audited_signal_set };
}
