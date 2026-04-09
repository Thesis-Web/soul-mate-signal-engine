import type {
  ArtifactPlanEntry,
  FailureOnlyArtifact,
  SuccessfulRunOptionalArtifact,
  SuccessfulRunRequiredArtifact,
} from '../types/artifacts.js';
import {
  failureOnlyArtifacts,
  successfulRunOptionalArtifacts,
  successfulRunRequiredArtifacts,
} from '../types/artifacts.js';

const requiredArtifactRoleMap: Record<
  SuccessfulRunRequiredArtifact,
  ArtifactPlanEntry['artifact_role']
> = {
  '01-subject-profile.json': 'subject_profile',
  '02-candidate-pool.json': 'candidate_pool',
  '03-audited-signal-set.json': 'audited_signal_set',
  '04-match-scorecard.json': 'match_scorecard',
  '05-output-brief.md': 'output_brief',
  '06-review-log.json': 'review_log',
};

const optionalArtifactRoleMap: Record<
  SuccessfulRunOptionalArtifact,
  ArtifactPlanEntry['artifact_role']
> = {
  '07-opener-pack.json': 'opener_pack',
  '08-run-metrics.json': 'run_metrics',
  '09-professional-report.json': 'professional_report_contract',
  '10-professional-report.md': 'professional_report_document',
};

const failureArtifactRoleMap: Record<FailureOnlyArtifact, ArtifactPlanEntry['artifact_role']> = {
  '00-failure-log.json': 'failure_log',
};

export function getSuccessfulArtifactPlan(): ArtifactPlanEntry[] {
  const requiredEntries = successfulRunRequiredArtifacts.map((fileName) => {
    const sequence = Number(fileName.slice(0, 2));
    return {
      sequence,
      file_name: fileName,
      artifact_role: requiredArtifactRoleMap[fileName],
      requirement_level: 'required' as const,
    };
  });

  const optionalEntries = successfulRunOptionalArtifacts.map((fileName) => {
    const sequence = Number(fileName.slice(0, 2));
    return {
      sequence,
      file_name: fileName,
      artifact_role: optionalArtifactRoleMap[fileName],
      requirement_level: 'optional' as const,
    };
  });

  return [...requiredEntries, ...optionalEntries];
}

export function getFailureArtifactPlan(): ArtifactPlanEntry[] {
  return failureOnlyArtifacts.map((fileName) => {
    const sequence = Number(fileName.slice(0, 2));
    return {
      sequence,
      file_name: fileName,
      artifact_role: failureArtifactRoleMap[fileName],
      requirement_level: 'failure_only' as const,
    };
  });
}
