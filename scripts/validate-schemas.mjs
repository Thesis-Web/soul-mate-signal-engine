import fs from 'node:fs';
import path from 'node:path';

const schemaRoot = path.resolve('schemas');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

if (!fs.existsSync(schemaRoot)) {
  console.error('schemas directory not found.');
  process.exit(1);
}

const files = walk(schemaRoot).filter((file) => file.endsWith('.md'));

if (files.length === 0) {
  console.error('No schema markdown files found under schemas.');
  process.exit(1);
}

const failures = [];

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const rel = path.relative(process.cwd(), file);

  if (!/^version:\s*\d+\.\d+\.\d+\s*$/m.test(raw)) {
    failures.push(`${rel}: missing version header`);
  }

  if (!/^status:\s*(draft|active|deprecated)\s*$/m.test(raw)) {
    failures.push(`${rel}: missing status header`);
  }

  if (!/^##\s+Required Fields\s*$/m.test(raw)) {
    failures.push(`${rel}: missing Required Fields section`);
  }
}

if (failures.length > 0) {
  console.error('Schema validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Schema validation passed.');
