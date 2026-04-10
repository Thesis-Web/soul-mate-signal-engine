import { normalizeHandle } from '../index.js';
import type { AgentPayload, NormalizedAgentIngestionResult } from '../types/agent-payload.js';
import type { RomanticFitStatus } from '../types/runtime-contract.js';

function mergeUnique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))];
}

function mergeRomanticFitStatus(statuses: RomanticFitStatus[]): RomanticFitStatus {
  if (statuses.includes('not_aligned')) {
    return 'not_aligned';
  }

  if (statuses.includes('aligned')) {
    return 'aligned';
  }

  return 'unknown';
}

export function normalizeAgentPayloads(payloads: AgentPayload[]): NormalizedAgentIngestionResult {
  if (payloads.length === 0) {
    throw new Error('At least one agent payload is required.');
  }

  const first = payloads[0];
  if (!first) {
    throw new Error('At least one agent payload is required.');
  }

  const subjectHandle = normalizeHandle(first.subject.handle);

  const mismatchedHandle = payloads.find(
    (payload) => normalizeHandle(payload.subject.handle) !== subjectHandle,
  );

  if (mismatchedHandle) {
    throw new Error('All agent payloads must reference the same subject handle.');
  }

  const subject_profile = {
    handle: subjectHandle,
    profile_bio:
      payloads.map((payload) => payload.subject.bio.trim()).find((value) => value.length > 0) ?? '',
    pinned_post_excerpt:
      payloads
        .map((payload) => payload.subject.pinned_post_excerpt.trim())
        .find((value) => value.length > 0) ?? '',
    recent_posts: mergeUnique(payloads.flatMap((payload) => payload.subject.recent_posts)),
    interests: mergeUnique(payloads.flatMap((payload) => payload.subject.interests)),
    humor_style: first.subject.humor_style,
    emotional_tone: first.subject.emotional_tone,
    relationship_signals: mergeUnique(
      payloads.flatMap((payload) => payload.subject.relationship_signals),
    ),
    cadence_summary:
      payloads
        .map((payload) => payload.subject.cadence_summary.trim())
        .find((value) => value.length > 0) ?? '',
    evidence_items: payloads.flatMap((payload) => payload.subject.evidence),
  };

  const candidateMap = new Map<
    string,
    {
      matched_interests: string[];
      interest_overlap_scores: number[];
      community_overlap_signals: string[];
      candidate_evidence: (typeof first.candidates)[number]['candidate_evidence'];
      communication_style: (typeof first.candidates)[number]['communication_style'];
      availability_signal: (typeof first.candidates)[number]['availability_signal'];
      romantic_fit_statuses: RomanticFitStatus[];
      energy_levels: number[];
      caution_flags: string[];
      disqualifier_flags: string[];
      spark_indicators: string[];
      audit_evidence: (typeof first.candidates)[number]['audit_evidence'];
    }
  >();

  for (const payload of payloads) {
    for (const candidate of payload.candidates) {
      const handle = normalizeHandle(candidate.handle);
      const existing = candidateMap.get(handle);
      const romanticFitStatus = candidate.romantic_fit_status ?? 'unknown';

      if (!existing) {
        candidateMap.set(handle, {
          matched_interests: [...candidate.matched_interests],
          interest_overlap_scores: [candidate.interest_overlap_score],
          community_overlap_signals: [...candidate.community_overlap_signals],
          candidate_evidence: [...candidate.candidate_evidence],
          communication_style: candidate.communication_style,
          availability_signal: candidate.availability_signal,
          romantic_fit_statuses: [romanticFitStatus],
          energy_levels: [candidate.energy_level],
          caution_flags: [...candidate.caution_flags],
          disqualifier_flags: [...candidate.disqualifier_flags],
          spark_indicators: [...candidate.spark_indicators],
          audit_evidence: [...candidate.audit_evidence],
        });
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
    }
  }

  const candidate_pool = [...candidateMap.entries()].map(([handle, value]) => ({
    handle,
    matched_interests: mergeUnique(value.matched_interests),
    interest_overlap_score:
      Math.round(
        (value.interest_overlap_scores.reduce((sum, item) => sum + item, 0) /
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
    romantic_fit_status: mergeRomanticFitStatus(value.romantic_fit_statuses),
    energy_level:
      Math.round(
        (value.energy_levels.reduce((sum, item) => sum + item, 0) / value.energy_levels.length) *
          100,
      ) / 100,
    caution_flags: mergeUnique(value.caution_flags),
    disqualifier_flags: mergeUnique(value.disqualifier_flags),
    spark_indicators: mergeUnique(value.spark_indicators),
    evidence_items: value.audit_evidence,
  }));

  return {
    subject_profile,
    candidate_pool,
    audited_signal_set,
  };
}
