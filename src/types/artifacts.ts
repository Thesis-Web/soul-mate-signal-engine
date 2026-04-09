import type { EvidenceClass, EvidenceItem, SourceClass } from './runtime-contract.js';

export const successfulRunRequiredArtifacts = [
  '01-subject-profile.json',
  '02-candidate-pool.json',
  '03-audited-signal-set.json',
  '04-match-scorecard.json',
  '05-output-brief.md',
  '06-review-log.json',
] as const;

export const successfulRunOptionalArtifacts = [
  '07-opener-pack.json',
  '08-run-metrics.json',
] as const;

export const failureOnlyArtifacts = ['00-failure-log.json'] as const;

export type SuccessfulRunRequiredArtifact = (typeof successfulRunRequiredArtifacts)[number];
export type SuccessfulRunOptionalArtifact = (typeof successfulRunOptionalArtifacts)[number];
export type FailureOnlyArtifact = (typeof failureOnlyArtifacts)[number];

export type ArtifactFileName =
  | SuccessfulRunRequiredArtifact
  | SuccessfulRunOptionalArtifact
  | FailureOnlyArtifact;

export type ArtifactRole =
  | 'failure_log'
  | 'subject_profile'
  | 'candidate_pool'
  | 'audited_signal_set'
  | 'match_scorecard'
  | 'output_brief'
  | 'review_log'
  | 'opener_pack'
  | 'run_metrics';

export type ArtifactRequirementLevel = 'required' | 'optional' | 'failure_only';
export type RunStatus = 'success' | 'failure';

export interface ArtifactPlanEntry {
  sequence: number;
  file_name: ArtifactFileName;
  artifact_role: ArtifactRole;
  requirement_level: ArtifactRequirementLevel;
}

export interface RunArtifactManifest {
  run_id: string;
  run_status: RunStatus;
  created_at: string;
  artifacts: ArtifactPlanEntry[];
}

export interface ReviewLog {
  run_id: string;
  reviewer_mode: 'human_required';
  created_at: string;
  notes: string[];
  caution_summary: string[];
  unknown_summary: string[];
}

export interface BuildEvidenceItemInput {
  index: number;
  source_class: SourceClass;
  source_reference: string;
  observed_text_excerpt: string;
  observed_at?: string;
  evidence_class: EvidenceClass;
}

export type NarrativeSupportEvidence = Pick<EvidenceItem, 'evidence_class'>;
