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
  'templates',
  'manifests',
  'logs',
  'runs',
  'outputs',
  'scripts',
  'src',
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
