import fs from 'node:fs';
import path from 'node:path';

const schemaFiles = [
  'schemas/evidence-item.schema.json',
  'schemas/subject-input.schema.json',
  'schemas/subject-profile.schema.json',
  'schemas/candidate-match.schema.json',
  'schemas/audited-signal.schema.json',
  'schemas/ranked-match.schema.json',
];

const failures = [];

for (const rel of schemaFiles) {
  const full = path.resolve(rel);

  if (!fs.existsSync(full)) {
    failures.push(`${rel}: missing`);
    continue;
  }

  const parsed = JSON.parse(fs.readFileSync(full, 'utf8'));

  if (parsed.type !== 'object') {
    failures.push(`${rel}: root type must be object`);
  }

  if (typeof parsed.$schema !== 'string' || parsed.$schema.length === 0) {
    failures.push(`${rel}: missing $schema`);
  }

  if (typeof parsed.$id !== 'string' || parsed.$id.length === 0) {
    failures.push(`${rel}: missing $id`);
  }

  if (!Array.isArray(parsed.required) || parsed.required.length === 0) {
    failures.push(`${rel}: missing required array`);
  }
}

const scoringConfig = JSON.parse(
  fs.readFileSync(path.resolve('manifests/scoring-config.default.json'), 'utf8'),
);

const requiredWeightKeys = [
  'interest_overlap',
  'humor_style_resonance',
  'values_alignment',
  'social_tempo',
  'relationship_signal_compatibility',
  'emotional_tone_fit',
  'community_adjacency',
  'reciprocity_probability',
];

const scoringKeys = Object.keys(scoringConfig.weights ?? {}).sort();
const expectedKeys = [...requiredWeightKeys].sort();

if (JSON.stringify(scoringKeys) !== JSON.stringify(expectedKeys)) {
  failures.push('manifests/scoring-config.default.json: weight keys do not match contract');
}

const totalWeight = requiredWeightKeys.reduce((sum, key) => {
  return sum + Number(scoringConfig.weights?.[key] ?? 0);
}, 0);

if (totalWeight !== 100) {
  failures.push(
    `manifests/scoring-config.default.json: weights must sum to 100, received ${totalWeight}`,
  );
}

const outputPolicy = JSON.parse(
  fs.readFileSync(path.resolve('manifests/output-language-policy.json'), 'utf8'),
);

if (!Array.isArray(outputPolicy.banned_phrases) || outputPolicy.banned_phrases.length === 0) {
  failures.push('manifests/output-language-policy.json: banned_phrases must be non-empty');
}

if (!Array.isArray(outputPolicy.allowed_phrases) || outputPolicy.allowed_phrases.length === 0) {
  failures.push('manifests/output-language-policy.json: allowed_phrases must be non-empty');
}

if (failures.length > 0) {
  console.error('Runtime contract validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Runtime contract validation passed.');
