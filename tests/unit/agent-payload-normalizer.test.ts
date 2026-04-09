import { describe, expect, it } from 'vitest';
import { normalizeAgentPayloads } from '../../src/ingestion/normalize-agent-payload.js';
import type { AgentPayload } from '../../src/types/agent-payload.js';

const grokPayload: AgentPayload = {
  dataset_version: '1.0.0',
  dataset_type: 'compatibility_signal_research',
  agent_id: 'grok',
  captured_at: '2026-04-09T21:20:00Z',
  subject: {
    handle: 'james_signal',
    bio: 'Systems-minded builder.',
    pinned_post_excerpt: 'Shared curiosity matters.',
    recent_posts: ['architecture and coffee'],
    interests: ['architecture', 'coffee'],
    humor_style: 'dry',
    emotional_tone: 'optimistic',
    relationship_signals: ['looking for something real'],
    cadence_summary: 'steady thoughtful posting cadence',
    evidence: [
      {
        evidence_id: 'evidence-1001',
        source_class: 'public_x_profile',
        source_reference: 'https://x.com/james_signal',
        observed_text_excerpt: 'Systems-minded builder.',
        evidence_class: 'observed_public_signal',
      },
    ],
  },
  candidates: [
    {
      handle: 'ada_signal',
      matched_interests: ['architecture'],
      interest_overlap_score: 80,
      community_overlap_signals: ['design-twitter crossover'],
      communication_style: 'thoughtful',
      availability_signal: 'available',
      energy_level: 7,
      caution_flags: [],
      disqualifier_flags: [],
      spark_indicators: ['book question'],
      candidate_evidence: [
        {
          evidence_id: 'evidence-1101',
          source_class: 'public_x_post',
          source_reference: 'https://x.com/ada_signal/status/100',
          observed_text_excerpt: 'Brutalist architecture photos.',
          evidence_class: 'observed_public_signal',
        },
      ],
      audit_evidence: [
        {
          evidence_id: 'evidence-1201',
          source_class: 'human_supplied_public_capture',
          source_reference: 'grok-capture-ada-001',
          observed_text_excerpt: 'Consistency and curiosity.',
          evidence_class: 'reasonable_inference',
        },
      ],
    },
  ],
};

const perplexityPayload: AgentPayload = {
  dataset_version: '1.0.0',
  dataset_type: 'compatibility_signal_research',
  agent_id: 'perplexity',
  captured_at: '2026-04-09T21:21:00Z',
  subject: {
    handle: '@james_signal',
    bio: 'Systems-minded builder.',
    pinned_post_excerpt: 'Shared curiosity matters.',
    recent_posts: ['books and dogs'],
    interests: ['books', 'dogs'],
    humor_style: 'dry',
    emotional_tone: 'optimistic',
    relationship_signals: ['values depth over noise'],
    cadence_summary: 'steady thoughtful posting cadence',
    evidence: [
      {
        evidence_id: 'evidence-2001',
        source_class: 'public_web_link',
        source_reference: 'https://example.com/james-signal-note',
        observed_text_excerpt: 'Books and careful systems design.',
        evidence_class: 'observed_public_signal',
      },
    ],
  },
  candidates: [
    {
      handle: 'ada_signal',
      matched_interests: ['dogs', 'books'],
      interest_overlap_score: 70,
      community_overlap_signals: ['shared book discussion'],
      communication_style: 'thoughtful',
      availability_signal: 'available',
      energy_level: 8,
      caution_flags: [],
      disqualifier_flags: [],
      spark_indicators: ['asks what book changed how you think'],
      candidate_evidence: [
        {
          evidence_id: 'evidence-2101',
          source_class: 'public_web_link',
          source_reference: 'https://example.com/ada-roundup',
          observed_text_excerpt: 'Dogs and sci-fi rereads.',
          evidence_class: 'observed_public_signal',
        },
      ],
      audit_evidence: [
        {
          evidence_id: 'evidence-2201',
          source_class: 'human_supplied_public_capture',
          source_reference: 'perplexity-capture-ada-001',
          observed_text_excerpt: 'Values consistency.',
          evidence_class: 'reasonable_inference',
        },
      ],
    },
  ],
};

describe('agent payload normalizer', () => {
  it('merges payloads into runtime contracts', () => {
    const result = normalizeAgentPayloads([grokPayload, perplexityPayload]);

    expect(result.subject_profile.handle).toBe('james_signal');
    expect(result.subject_profile.interests).toEqual(['architecture', 'coffee', 'books', 'dogs']);
    expect(result.candidate_pool).toHaveLength(1);
    expect(result.candidate_pool[0]?.interest_overlap_score).toBe(75);
    expect(result.audited_signal_set[0]?.energy_level).toBe(7.5);
  });

  it('rejects mismatched subject handles', () => {
    const mismatched: AgentPayload = {
      ...perplexityPayload,
      subject: {
        ...perplexityPayload.subject,
        handle: 'different_handle',
      },
    };

    expect(() => normalizeAgentPayloads([grokPayload, mismatched])).toThrow(
      'All agent payloads must reference the same subject handle.',
    );
  });
});
