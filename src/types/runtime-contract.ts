export const scoreDimensionKeys = [
  'interest_overlap',
  'humor_style_resonance',
  'values_alignment',
  'social_tempo',
  'relationship_signal_compatibility',
  'emotional_tone_fit',
  'community_adjacency',
  'reciprocity_probability',
] as const;

export type ScoreDimensionKey = (typeof scoreDimensionKeys)[number];

export type InputType = 'handle' | 'x_url';

export type SourceClass =
  | 'public_x_profile'
  | 'public_x_post'
  | 'public_web_link'
  | 'human_supplied_public_capture';

export type EvidenceClass = 'observed_public_signal' | 'reasonable_inference' | 'unknown';

export type HumorStyle = 'dry' | 'absurdist' | 'self_deprecating' | 'wholesome' | 'none';

export type EmotionalTone = 'optimistic' | 'neutral' | 'venting' | 'melancholic';

export type CommunicationStyle = 'playful' | 'thoughtful' | 'debative' | 'supportive';

export type AvailabilitySignal = 'available' | 'unclear' | 'unavailable';

export type CautionBand = 'low' | 'moderate' | 'high';

export interface SubjectInput {
  subject_input: string;
  input_type: InputType;
  collected_at: string;
}

export interface EvidenceItem {
  evidence_id: string;
  source_class: SourceClass;
  source_reference: string;
  observed_text_excerpt: string;
  observed_at?: string;
  evidence_class: EvidenceClass;
}

export interface SubjectProfile {
  handle: string;
  profile_bio: string;
  pinned_post_excerpt: string;
  recent_posts: string[];
  interests: string[];
  humor_style: HumorStyle;
  emotional_tone: EmotionalTone;
  relationship_signals: string[];
  cadence_summary: string;
  evidence_items: EvidenceItem[];
}

export interface CandidateMatch {
  handle: string;
  matched_interests: string[];
  interest_overlap_score: number;
  community_overlap_signals: string[];
  evidence_items: EvidenceItem[];
}

export interface AuditedSignal {
  handle: string;
  communication_style: CommunicationStyle;
  availability_signal: AvailabilitySignal;
  energy_level: number;
  caution_flags: string[];
  disqualifier_flags: string[];
  spark_indicators: string[];
  evidence_items: EvidenceItem[];
}

export type DimensionScores = Record<ScoreDimensionKey, number>;
export type ScoringWeights = Record<ScoreDimensionKey, number>;

export interface ScoringConfig {
  version: string;
  weights: ScoringWeights;
}

export interface RankedMatch {
  rank: number;
  handle: string;
  compatibility_score: number;
  dimension_scores: DimensionScores;
  evidence_strength: number;
  recency_strength: number;
  caution_band: CautionBand;
  explanation: string;
  opener_suggestion: string;
  source_links: string[];
}

export interface OutputLanguagePolicy {
  version: string;
  banned_phrases: string[];
  allowed_phrases: string[];
}
