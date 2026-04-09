import { describe, expect, it } from 'vitest';
import {
  assertAllowedOutputLanguage,
  hasBannedPhrase,
} from '../../src/contract/output-language.js';
import type { OutputLanguagePolicy } from '../../src/types/runtime-contract.js';

const policy: OutputLanguagePolicy = {
  version: '0.1.0',
  banned_phrases: ['soulmate confirmed', 'perfect match', 'guaranteed fit'],
  allowed_phrases: ['signal-based match', 'probable overlap', 'requires human judgment'],
};

describe('output language policy', () => {
  it('detects banned certainty language', () => {
    expect(hasBannedPhrase('This is a soulmate confirmed result.', policy)).toBe(true);
  });

  it('allows advisory language', () => {
    expect(hasBannedPhrase('This is a signal-based match with probable overlap.', policy)).toBe(
      false,
    );
  });

  it('throws when banned language appears', () => {
    expect(() => assertAllowedOutputLanguage('Perfect match for you.', policy)).toThrow(
      'Output contains banned certainty language.',
    );
  });
});
