import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { runFromAgentPayloads } from '../orchestration/run-from-agent-payloads.js';
import type { OutputLanguagePolicy, ScoringConfig } from '../index.js';
import type { ProfessionalReportContract } from '../types/artifacts.js';

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function getArgs(flag: string): string[] {
  const values: string[] = [];

  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === flag) {
      const value = process.argv[index + 1];
      if (value) {
        values.push(value);
      }
    }
  }

  return values;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(path.resolve(filePath), 'utf8');
  return JSON.parse(raw) as T;
}

async function main(): Promise<void> {
  const runId = getArg('--run-id')?.trim();
  const createdAt = getArg('--created-at')?.trim();
  const payloadPaths = getArgs('--payload');

  if (!runId) {
    throw new Error('Missing required --run-id');
  }

  if (!createdAt) {
    throw new Error('Missing required --created-at');
  }

  if (payloadPaths.length === 0) {
    throw new Error('At least one --payload is required');
  }

  const outputDir = path.resolve('runs', runId);

  const scoringConfig = await readJsonFile<ScoringConfig>('manifests/scoring-config.default.json');
  const outputLanguagePolicy = await readJsonFile<OutputLanguagePolicy>(
    'manifests/output-language-policy.json',
  );
  const professionalReportContract = await readJsonFile<ProfessionalReportContract>(
    'manifests/professional-report-contract.json',
  );

  const result = await runFromAgentPayloads({
    runId,
    createdAt,
    payloadPaths,
    outputDir,
    scoringConfig,
    outputLanguagePolicy,
    professionalReportContract,
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
