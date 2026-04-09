import { describe, expect, it } from 'vitest';
import {
  assertNarrativeSupport,
  buildEvidenceId,
  buildEvidenceItem,
} from '../../src/artifacts/evidence-builder.js';

describe('evidence builder', () => {
  it('builds deterministic evidence ids', () => {
    expect(buildEvidenceId(7)).toBe('evidence-0007');
  });

  it('builds normalized evidence items', () => {
    expect(
      buildEvidenceItem({
        index: 1,
        source_class: 'public_x_post',
        source_reference: ' https://x.com/example/status/1 ',
        observed_text_excerpt: '  Loves   architecture   and long walks. ',
        evidence_class: 'observed_public_signal',
      }),
    ).toEqual({
      evidence_id: 'evidence-0001',
      source_class: 'public_x_post',
      source_reference: 'https://x.com/example/status/1',
      observed_text_excerpt: 'Loves architecture and long walks.',
      evidence_class: 'observed_public_signal',
    });
  });

  it('rejects narrative support backed only by unknown evidence', () => {
    expect(() =>
      assertNarrativeSupport([{ evidence_class: 'unknown' }, { evidence_class: 'unknown' }]),
    ).toThrow('Narrative output must not be supported only by unknown evidence.');
  });

  it('accepts observed or inferred narrative support', () => {
    expect(() =>
      assertNarrativeSupport([
        { evidence_class: 'unknown' },
        { evidence_class: 'reasonable_inference' },
      ]),
    ).not.toThrow();
  });
});
