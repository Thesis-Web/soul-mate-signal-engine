import { describe, expect, it } from 'vitest';
import { computeWeightedScore, validateWeightSum } from '../../src/contract/scoring.js';
import type { DimensionScores, ScoringConfig } from '../../src/types/runtime-contract.js';

const scoringConfig: ScoringConfig = {
  version: '0.1.0',
  weights: {
    interest_overlap: 9,
    humor_style_resonance: 15,
    values_alignment: 15,
    social_tempo: 10,
    relationship_signal_compatibility: 10,
    emotional_tone_fit: 10,
    community_adjacency: 10,
    reciprocity_probability: 10,
    orientation_alignment: 11,
  },
};

const dimensionScores: DimensionScores = {
  interest_overlap: 80,
  humor_style_resonance: 70,
  values_alignment: 90,
  social_tempo: 60,
  relationship_signal_compatibility: 50,
  emotional_tone_fit: 75,
  community_adjacency: 85,
  reciprocity_probability: 65,
  orientation_alignment: 80,
};

describe('scoring contract', () => {
  it('accepts a weight map that sums to 100', () => {
    expect(validateWeightSum(scoringConfig)).toBe(100);
  });

  it('computes a weighted score with uncertainty penalty', () => {
    expect(computeWeightedScore(dimensionScores, scoringConfig, 5)).toBe(68.5);
  });

  it('rejects invalid weight sums', () => {
    const invalidConfig: ScoringConfig = {
      ...scoringConfig,
      weights: {
        ...scoringConfig.weights,
        reciprocity_probability: 11,
        orientation_alignment: 11,
      },
    };

    expect(() => validateWeightSum(invalidConfig)).toThrow(
      'Scoring weights must sum to 100. Received 101.',
    );
  });
});
