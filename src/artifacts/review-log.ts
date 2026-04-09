import type { ReviewLog } from '../types/artifacts.js';

export function buildReviewLog(input: {
  run_id: string;
  created_at: string;
  notes?: string[];
  caution_summary?: string[];
  unknown_summary?: string[];
}): ReviewLog {
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
    reviewer_mode: 'human_required',
    created_at: createdAt,
    notes: input.notes ?? [],
    caution_summary: input.caution_summary ?? [],
    unknown_summary: input.unknown_summary ?? [],
  };
}
