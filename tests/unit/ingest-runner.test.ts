import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runFromAgentPayloads } from '../../src/orchestration/run-from-agent-payloads.js';
import type { ProfessionalReportContract } from '../../src/types/artifacts.js';
import type { OutputLanguagePolicy, ScoringConfig } from '../../src/index.js';

async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

const scoringConfig: ScoringConfig = {
  version: '0.1.0',
  weights: {
    interest_overlap: 9,
    humor_style_resonance: 15,
    values_alignment: 15,
    social_tempo: 10,
    relationship_signal_compatibility: 10,
    emotional_tone_fit: 10,
    community_adjacency: 10,
    reciprocity_probability: 10,
    orientation_alignment: 11,
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

const professionalReportContract: ProfessionalReportContract = {
  version: '0.1.0',
  operator_mode: 'human_as_interface',
  required_sections: [
    'executive_summary',
    'subject_signal_summary',
    'ranked_candidates',
    'cautions_and_unknowns',
    'operator_next_actions',
    'advisory_boundary',
  ],
  max_ranked_candidates: 5,
  requires_advisory_boundary: true,
};

describe('ingest runner', () => {
  it('normalizes agent payloads and emits ingest artifacts including PDF report', async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'smse-ingest-'));
    const outputDir = path.join(tempRoot, 'run-20260410-james-live-01');
    const payloadDir = path.join(tempRoot, 'payloads');

    const grokPayload = await readJsonFile('fixtures/agent-input/sample-payloads/grok-sample.json');
    const perplexityPayload = await readJsonFile(
      'fixtures/agent-input/sample-payloads/perplexity-sample.json',
    );

    await writeFile(
      path.join(payloadDir, '../grok.json').replace('/payloads/../', '/'),
      JSON.stringify(grokPayload, null, 2),
    );
    await writeFile(
      path.join(payloadDir, '../perplexity.json').replace('/payloads/../', '/'),
      JSON.stringify(perplexityPayload, null, 2),
    );

    const result = await runFromAgentPayloads({
      runId: 'run-20260410-james-live-01',
      createdAt: '2026-04-10T02:00:00Z',
      payloadPaths: [path.join(tempRoot, 'grok.json'), path.join(tempRoot, 'perplexity.json')],
      outputDir,
      scoringConfig,
      outputLanguagePolicy,
      professionalReportContract,
    });

    expect(result.rankedMatches[0]?.handle).toBe('ada_signal');

    const files = (await readdir(outputDir)).sort();
    expect(files).toEqual([
      '00-debug.log',
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
      '11-professional-report.pdf',
    ]);

    const report = await readJsonFile<{ advisory_boundary: string }>(
      path.join(outputDir, '09-professional-report.json'),
    );
    expect(report.advisory_boundary).toContain('attraction preference');

    const pdfStat = await readFile(path.join(outputDir, '11-professional-report.pdf'));
    expect(pdfStat.byteLength).toBeGreaterThan(1000);
  });
});
