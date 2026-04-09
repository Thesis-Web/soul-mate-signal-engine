import fs from 'node:fs';
import path from 'node:path';

const requiredPaths = [
  'README.md',
  'LICENSE',
  '.editorconfig',
  '.gitignore',
  '.prettierrc.json',
  '.prettierignore',
  '.markdownlint.json',
  '.markdownlintignore',
  '.nvmrc',
  'package.json',
  'tsconfig.json',
  'vitest.config.ts',
  '.github/workflows/ci.yml',
  'docs',
  'docs/blueprints',
  'docs/engineering-specs',
  'docs/operator-guides',
  'docs/project-constitution',
  'prompts',
  'schemas',
  'schemas/evidence-item.schema.json',
  'schemas/subject-input.schema.json',
  'schemas/subject-profile.schema.json',
  'schemas/candidate-match.schema.json',
  'schemas/audited-signal.schema.json',
  'schemas/ranked-match.schema.json',
  'templates',
  'manifests',
  'manifests/scoring-config.default.json',
  'manifests/output-language-policy.json',
  'logs',
  'runs',
  'outputs',
  'scripts',
  'scripts/validate-runtime-contracts.mjs',
  'src',
  'src/types',
  'src/contract',
  'src/types/runtime-contract.ts',
  'src/contract/scoring.ts',
  'src/contract/output-language.ts',
  'tests',
  'tests/unit',
  'tests/integration',
];

const missing = requiredPaths.filter((item) => !fs.existsSync(path.resolve(item)));

if (missing.length > 0) {
  console.error('Missing required repository paths:');
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log('Repository structure validation passed.');
