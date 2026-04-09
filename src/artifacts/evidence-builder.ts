import type { BuildEvidenceItemInput, NarrativeSupportEvidence } from '../types/artifacts.js';
import type { EvidenceItem } from '../types/runtime-contract.js';

function normalizeExcerpt(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function buildEvidenceId(index: number): string {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error('Evidence index must be a non-negative integer.');
  }

  return `evidence-${String(index).padStart(4, '0')}`;
}

export function buildEvidenceItem(input: BuildEvidenceItemInput): EvidenceItem {
  const sourceReference = input.source_reference.trim();
  const observedTextExcerpt = normalizeExcerpt(input.observed_text_excerpt);

  if (sourceReference.length === 0) {
    throw new Error('source_reference is required.');
  }

  if (observedTextExcerpt.length === 0) {
    throw new Error('observed_text_excerpt is required.');
  }

  return {
    evidence_id: buildEvidenceId(input.index),
    source_class: input.source_class,
    source_reference: sourceReference,
    observed_text_excerpt: observedTextExcerpt,
    ...(input.observed_at ? { observed_at: input.observed_at } : {}),
    evidence_class: input.evidence_class,
  };
}

export function assertNarrativeSupport(evidenceItems: NarrativeSupportEvidence[]): void {
  const supported = evidenceItems.some(
    (item) =>
      item.evidence_class === 'observed_public_signal' ||
      item.evidence_class === 'reasonable_inference',
  );

  if (!supported) {
    throw new Error('Narrative output must not be supported only by unknown evidence.');
  }
}
