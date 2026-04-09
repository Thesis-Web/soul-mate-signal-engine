import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const exts = new Set(['.json', '.yml', '.yaml']);
const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'coverage']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (exts.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

const failures = [];

for (const file of walk(process.cwd())) {
  const raw = fs.readFileSync(file, 'utf8');
  const ext = path.extname(file);

  try {
    if (ext === '.json') {
      JSON.parse(raw);
    } else {
      YAML.parse(raw);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${file}: ${message}`);
  }
}

if (failures.length > 0) {
  console.error('JSON/YAML validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('JSON/YAML validation passed.');
