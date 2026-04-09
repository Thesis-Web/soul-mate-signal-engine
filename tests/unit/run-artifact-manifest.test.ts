import { describe, expect, it } from 'vitest';
import { buildRunArtifactManifest } from '../../src/artifacts/run-artifact-manifest.js';
import { buildReviewLog } from '../../src/artifacts/review-log.js';

describe('run artifact manifest', () => {
  it('builds success manifests with required and optional artifacts', () => {
    const manifest = buildRunArtifactManifest({
      run_id: 'run-20260409-smse-ingest-01',
      run_status: 'success',
      created_at: '2026-04-09T21:25:00Z',
    });

    expect(manifest.artifacts.map((item) => item.file_name)).toEqual([
      '01-subject-profile.json',
      '02-candidate-pool.json',
      '03-audited-signal-set.json',
      '04-match-scorecard.json',
      '05-output-brief.md',
      '06-review-log.json',
      '07-opener-pack.json',
      '08-run-metrics.json',
      '09-professional-report.json',
      '10-professional-report.md',
    ]);
  });

  it('builds failure manifests with only the failure artifact', () => {
    const manifest = buildRunArtifactManifest({
      run_id: 'run-20260409-smse-ingest-01',
      run_status: 'failure',
      created_at: '2026-04-09T21:25:00Z',
    });

    expect(manifest.artifacts.map((item) => item.file_name)).toEqual(['00-failure-log.json']);
  });
});

describe('review log builder', () => {
  it('builds human-required review logs', () => {
    const reviewLog = buildReviewLog({
      run_id: 'run-20260409-smse-ingest-01',
      created_at: '2026-04-09T21:25:00Z',
      notes: ['Human review required.'],
      caution_summary: ['caution one'],
      unknown_summary: ['unknown one'],
    });

    expect(reviewLog.reviewer_mode).toBe('human_required');
    expect(reviewLog.notes).toEqual(['Human review required.']);
    expect(reviewLog.caution_summary).toEqual(['caution one']);
    expect(reviewLog.unknown_summary).toEqual(['unknown one']);
  });
});
