import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runDryRunFromFixtures } from '../../src/orchestration/dry-runner.js';
import type { OutputLanguagePolicy, ScoringConfig } from '../../src/index.js';

const scoringConfig: ScoringConfig = {
  version: '0.1.0',
  weights: {
    interest_overlap: 20,
    humor_style_resonance: 15,
    values_alignment: 15,
    social_tempo: 10,
    relationship_signal_compatibility: 10,
    emotional_tone_fit: 10,
    community_adjacency: 10,
    reciprocity_probability: 10,
  },
};

const outputLanguagePolicy: OutputLanguagePolicy = {
  version: '0.1.0',
  banned_phrases: [
    'soulmate confirmed',
    'perfect match',
    'guaranteed fit',
    'destined',
    'definitely single',
    'love certainty',
  ],
  allowed_phrases: [
    'signal-based match',
    'probable overlap',
    'advisory fit',
    'possible conversation match',
    'evidence-backed resonance',
    'requires human judgment',
  ],
};

describe('dry-run runner', () => {
  it('emits deterministic required artifacts from fixtures', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'smse-dry-run-'));
    const outputDir = path.join(tempRoot, 'run-20260409-smse-01');

    const result = await runDryRunFromFixtures({
      runId: 'run-20260409-smse-01',
      createdAt: '2026-04-09T21:10:00Z',
      fixtureDir: path.resolve('fixtures/dry-run/sample-run'),
      outputDir,
      scoringConfig,
      outputLanguagePolicy,
    });

    expect(result.rankedMatches[0]?.handle).toBe('ada_signal');

    const files = (await readdir(outputDir)).sort();
    expect(files).toEqual([
      '01-subject-profile.json',
      '02-candidate-pool.json',
      '03-audited-signal-set.json',
      '04-match-scorecard.json',
      '05-output-brief.md',
      '06-review-log.json',
      '08-run-metrics.json',
    ]);

    const brief = await readFile(path.join(outputDir, '05-output-brief.md'), 'utf8');
    expect(brief).toContain('Output Brief - run-20260409-smse-01');
    expect(brief).toContain('@ada_signal');
  });
});
