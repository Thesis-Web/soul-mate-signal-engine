import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const runsDir = path.join(repoRoot, 'runs');
const outputsDir = path.join(repoRoot, 'outputs');

const RUN_DIR_RE = /^run-\d{8}-[a-z0-9-]+-\d{2}$/;
const OUTPUT_FILE_RE = /^[a-z0-9][a-z0-9-]*-v\d+\.\d+\.\d+\.(md|json)$/;

const failures = [];

if (fs.existsSync(runsDir)) {
  const runDirs = fs
    .readdirSync(runsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== '.gitkeep');

  for (const runDir of runDirs) {
    if (!RUN_DIR_RE.test(runDir)) {
      failures.push(`runs/${runDir}: invalid run directory name`);
    }
  }
}

if (fs.existsSync(outputsDir)) {
  const files = fs
    .readdirSync(outputsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name !== '.gitkeep');

  for (const file of files) {
    if (!OUTPUT_FILE_RE.test(file)) {
      failures.push(`outputs/${file}: invalid output artifact filename`);
    }
  }
}

if (failures.length > 0) {
  console.error('Artifact filename validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Artifact filename validation passed.');
