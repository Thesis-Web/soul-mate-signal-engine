import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { runFromAgentPayloads } from '../orchestration/run-from-agent-payloads.js';
import type { OutputLanguagePolicy, ScoringConfig } from '../index.js';

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function getArgs(flag: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === flag) {
      const next = process.argv[index + 1];
      if (next) values.push(next);
    }
  }
  return values;
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

async function main(): Promise<void> {
  const runId = getArg('--run-id') ?? 'run-20260409-smse-ingest-01';
  const createdAt = getArg('--created-at') ?? '2026-04-09T21:25:00Z';
  const outputDir = getArg('--output-dir') ?? path.resolve('runs', runId);
  const payloadPaths = getArgs('--payload');

  if (payloadPaths.length === 0) {
    throw new Error('At least one --payload argument is required.');
  }

  const scoringConfig = await readJson<ScoringConfig>(
    path.resolve('manifests/scoring-config.default.json'),
  );
  const outputLanguagePolicy = await readJson<OutputLanguagePolicy>(
    path.resolve('manifests/output-language-policy.json'),
  );

  const result = await runFromAgentPayloads({
    runId,
    createdAt,
    payloadPaths: payloadPaths.map((item) => path.resolve(item)),
    outputDir,
    scoringConfig,
    outputLanguagePolicy,
  });

  console.log(
    JSON.stringify(
      {
        run_id: runId,
        output_dir: result.outputDir,
        ranked_match_count: result.rankedMatches.length,
        top_handle: result.rankedMatches[0]?.handle ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Ingest run failed: ${message}`);
  process.exit(1);
});
