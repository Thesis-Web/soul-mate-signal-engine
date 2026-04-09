export const projectMeta = {
  name: 'soul-mate-signal-engine',
  version: '0.1.0',
  systemName: 'public-compatibility-signal-engine',
  outputMode: 'advisory-only',
} as const;

export function normalizeHandle(input: string): string {
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    throw new Error('Handle input is required.');
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  const withoutDomain = withoutProtocol.replace(/^x\.com\//i, '').replace(/^twitter\.com\//i, '');
  const withoutAt = withoutDomain.replace(/^@/, '');
  const handle = withoutAt.split(/[/?#]/, 1)[0]?.trim().toLowerCase();

  if (!handle) {
    throw new Error('Unable to normalize handle.');
  }

  return handle;
}

export * from './types/runtime-contract.js';
export * from './contract/scoring.js';
export * from './contract/output-language.js';
