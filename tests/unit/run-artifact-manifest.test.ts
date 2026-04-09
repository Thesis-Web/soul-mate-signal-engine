import { describe, expect, it } from 'vitest';
import { buildRunArtifactManifest } from '../../src/artifacts/run-artifact-manifest.js';
import { buildReviewLog } from '../../src/artifacts/review-log.js';

describe('run artifact manifest', () => {
  it('builds success manifests with required and optional artifacts', () => {
    const manifest = buildRunArtifactManifest({
      run_id: 'run-20260409-smse-01',
      run_status: 'success',
      created_at: '2026-04-09T20:59:00Z',
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
    ]);
  });

  it('builds failure manifests with only the failure artifact', () => {
    const manifest = buildRunArtifactManifest({
      run_id: 'run-20260409-smse-02',
      run_status: 'failure',
      created_at: '2026-04-09T21:00:00Z',
    });

    expect(manifest.artifacts.map((item) => item.file_name)).toEqual(['00-failure-log.json']);
  });
});

describe('review log builder', () => {
  it('builds human-required review logs', () => {
    expect(
      buildReviewLog({
        run_id: 'run-20260409-smse-03',
        created_at: '2026-04-09T21:01:00Z',
        notes: ['Initial review pending.'],
        caution_summary: ['Thin relationship-intent evidence.'],
        unknown_summary: ['Current availability remains unknown.'],
      }),
    ).toEqual({
      run_id: 'run-20260409-smse-03',
      reviewer_mode: 'human_required',
      created_at: '2026-04-09T21:01:00Z',
      notes: ['Initial review pending.'],
      caution_summary: ['Thin relationship-intent evidence.'],
      unknown_summary: ['Current availability remains unknown.'],
    });
  });
});
