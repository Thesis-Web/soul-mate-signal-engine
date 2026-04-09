import type { OutputLanguagePolicy } from '../types/runtime-contract.js';

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

export function hasBannedPhrase(text: string, policy: OutputLanguagePolicy): boolean {
  const normalizedText = normalize(text);
  return policy.banned_phrases.some((phrase) => normalizedText.includes(normalize(phrase)));
}

export function assertAllowedOutputLanguage(text: string, policy: OutputLanguagePolicy): void {
  if (hasBannedPhrase(text, policy)) {
    throw new Error('Output contains banned certainty language.');
  }
}
