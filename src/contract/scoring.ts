import {
  scoreDimensionKeys,
  type DimensionScores,
  type ScoringConfig,
} from '../types/runtime-contract.js';

function clampScore(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value * 100) / 100;
}

export function validateWeightSum(config: ScoringConfig): number {
  const total = scoreDimensionKeys.reduce((sum, key) => sum + config.weights[key], 0);

  if (total !== 100) {
    throw new Error(`Scoring weights must sum to 100. Received ${total}.`);
  }

  return total;
}

export function computeWeightedScore(
  dimensionScores: DimensionScores,
  config: ScoringConfig,
  uncertaintyPenalty = 0,
): number {
  validateWeightSum(config);

  const weighted = scoreDimensionKeys.reduce((sum, key) => {
    return sum + dimensionScores[key] * (config.weights[key] / 100);
  }, 0);

  return clampScore(weighted - uncertaintyPenalty);
}
