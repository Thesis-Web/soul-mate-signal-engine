import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runFromAgentPayloads } from '../../src/orchestration/run-from-agent-payloads.js';
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

describe('ingest runner', () => {
  it('emits deterministic artifacts from agent payloads', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'smse-ingest-'));
    const outputDir = path.join(tempRoot, 'run-20260409-smse-ingest-01');

    const result = await runFromAgentPayloads({
      runId: 'run-20260409-smse-ingest-01',
      createdAt: '2026-04-09T21:25:00Z',
      payloadPaths: [
        path.resolve('fixtures/agent-input/sample-payloads/grok-sample.json'),
        path.resolve('fixtures/agent-input/sample-payloads/perplexity-sample.json'),
      ],
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

    const scorecard = await readFile(path.join(outputDir, '04-match-scorecard.json'), 'utf8');
    expect(scorecard).toContain('ada_signal');
  });
});
