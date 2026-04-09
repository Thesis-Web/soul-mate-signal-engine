import fs from 'node:fs';
import path from 'node:path';

const schemaFiles = [
  'schemas/evidence-item.schema.json',
  'schemas/subject-input.schema.json',
  'schemas/subject-profile.schema.json',
  'schemas/candidate-match.schema.json',
  'schemas/audited-signal.schema.json',
  'schemas/ranked-match.schema.json',
  'schemas/run-artifact-manifest.schema.json',
  'schemas/review-log.schema.json',
  'schemas/agent-payload.schema.json',
  'schemas/professional-report.schema.json',
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

const artifactPolicy = JSON.parse(
  fs.readFileSync(path.resolve('manifests/artifact-policy.json'), 'utf8'),
);

const expectedSuccessfulRequired = [
  '01-subject-profile.json',
  '02-candidate-pool.json',
  '03-audited-signal-set.json',
  '04-match-scorecard.json',
  '05-output-brief.md',
  '06-review-log.json',
];

const expectedSuccessfulOptional = [
  '07-opener-pack.json',
  '08-run-metrics.json',
  '09-professional-report.json',
  '10-professional-report.md',
];

const expectedFailureOnly = ['00-failure-log.json'];

function sameArray(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

if (!sameArray(artifactPolicy.successful_run_required ?? [], expectedSuccessfulRequired)) {
  failures.push('manifests/artifact-policy.json: successful_run_required does not match contract');
}

if (!sameArray(artifactPolicy.successful_run_optional ?? [], expectedSuccessfulOptional)) {
  failures.push('manifests/artifact-policy.json: successful_run_optional does not match contract');
}

if (!sameArray(artifactPolicy.failure_only ?? [], expectedFailureOnly)) {
  failures.push('manifests/artifact-policy.json: failure_only does not match contract');
}

const professionalReportContract = JSON.parse(
  fs.readFileSync(path.resolve('manifests/professional-report-contract.json'), 'utf8'),
);

const expectedSections = [
  'executive_summary',
  'subject_signal_summary',
  'ranked_candidates',
  'cautions_and_unknowns',
  'operator_next_actions',
  'advisory_boundary',
];

if (professionalReportContract.operator_mode !== 'human_as_interface') {
  failures.push(
    'manifests/professional-report-contract.json: operator_mode must be human_as_interface',
  );
}

if (!sameArray(professionalReportContract.required_sections ?? [], expectedSections)) {
  failures.push(
    'manifests/professional-report-contract.json: required_sections does not match contract',
  );
}

if (Number(professionalReportContract.max_ranked_candidates) < 1) {
  failures.push(
    'manifests/professional-report-contract.json: max_ranked_candidates must be positive',
  );
}

if (professionalReportContract.requires_advisory_boundary !== true) {
  failures.push(
    'manifests/professional-report-contract.json: requires_advisory_boundary must be true',
  );
}

if (failures.length > 0) {
  console.error('Runtime contract validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Runtime contract validation passed.');
