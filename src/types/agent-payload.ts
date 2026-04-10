import type {
  AuditedSignal,
  CandidateMatch,
  EvidenceItem,
  GenderSignal,
  OrientationSignal,
  RomanticFitStatus,
  SubjectProfile,
} from './runtime-contract.js';

export type AgentId = 'grok' | 'perplexity' | 'chatgpt';
export type DatasetType = 'compatibility_signal_research';

export interface AgentPayloadSubject {
  handle: string;
  bio: string;
  pinned_post_excerpt: string;
  recent_posts: string[];
  interests: string[];
  humor_style: SubjectProfile['humor_style'];
  emotional_tone: SubjectProfile['emotional_tone'];
  relationship_signals: string[];
  cadence_summary: string;
  evidence: EvidenceItem[];
  orientation_signal?: OrientationSignal;
  gender_signal?: GenderSignal;
}

export interface AgentPayloadCandidate {
  handle: string;
  matched_interests: string[];
  interest_overlap_score: number;
  community_overlap_signals: string[];
  communication_style: AuditedSignal['communication_style'];
  availability_signal: AuditedSignal['availability_signal'];
  /** Public handle of who this candidate is currently with, if unavailable. */
  caught_by?: string;
  romantic_fit_status?: RomanticFitStatus;
  energy_level: number;
  caution_flags: string[];
  disqualifier_flags: string[];
  spark_indicators: string[];
  candidate_evidence: EvidenceItem[];
  audit_evidence: EvidenceItem[];
  orientation_signal?: OrientationSignal;
  gender_signal?: GenderSignal;
}

export interface AgentPayload {
  dataset_version: string;
  dataset_type: DatasetType;
  agent_id: AgentId;
  captured_at: string;
  subject: AgentPayloadSubject;
  candidates: AgentPayloadCandidate[];
}

export interface NormalizedAgentIngestionResult {
  subject_profile: SubjectProfile;
  candidate_pool: CandidateMatch[];
  audited_signal_set: AuditedSignal[];
}
