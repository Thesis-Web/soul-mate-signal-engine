import { getFailureArtifactPlan, getSuccessfulArtifactPlan } from './policy.js';
import type { RunArtifactManifest, RunStatus } from '../types/artifacts.js';

export function buildRunArtifactManifest(input: {
  run_id: string;
  run_status: RunStatus;
  created_at: string;
}): RunArtifactManifest {
  const runId = input.run_id.trim();
  const createdAt = input.created_at.trim();

  if (runId.length === 0) {
    throw new Error('run_id is required.');
  }

  if (createdAt.length === 0) {
    throw new Error('created_at is required.');
  }

  return {
    run_id: runId,
    run_status: input.run_status,
    created_at: createdAt,
    artifacts:
      input.run_status === 'failure' ? getFailureArtifactPlan() : getSuccessfulArtifactPlan(),
  };
}
