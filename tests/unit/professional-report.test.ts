import { describe, expect, it } from 'vitest';
import {
  buildProfessionalReport,
  renderProfessionalReportMarkdown,
} from '../../src/artifacts/professional-report.js';
import type { ProfessionalReportContract, ReviewLog } from '../../src/types/artifacts.js';
import type { RankedMatch, SubjectProfile } from '../../src/types/runtime-contract.js';

const contract: ProfessionalReportContract = {
  version: '0.1.0',
  operator_mode: 'human_as_interface',
  required_sections: [
    'executive_summary',
    'subject_signal_summary',
    'ranked_candidates',
    'cautions_and_unknowns',
    'operator_next_actions',
    'advisory_boundary',
  ],
  max_ranked_candidates: 5,
  requires_advisory_boundary: true,
};

const subjectProfile: SubjectProfile = {
  handle: 'elonmusk',
  profile_bio: 'Builder.',
  pinned_post_excerpt: '',
  recent_posts: ['autonomy', 'space'],
  interests: ['space exploration', 'artificial intelligence'],
  humor_style: 'dry',
  emotional_tone: 'optimistic',
  relationship_signals: [],
  cadence_summary: 'high-frequency posting',
  evidence_items: [
    {
      evidence_id: 'evidence-1001',
      source_class: 'public_x_profile',
      source_reference: 'https://x.com/elonmusk',
      observed_text_excerpt: 'Builder.',
      evidence_class: 'observed_public_signal',
    },
  ],
};

const rankedMatches: RankedMatch[] = [
  {
    rank: 1,
    handle: 'candidate_one',
    compatibility_score: 71.25,
    dimension_scores: {
      interest_overlap: 80,
      humor_style_resonance: 78,
      values_alignment: 74,
      social_tempo: 70,
      relationship_signal_compatibility: 50,
      emotional_tone_fit: 76,
      community_adjacency: 65,
      reciprocity_probability: 71,
    },
    evidence_strength: 85,
    recency_strength: 80,
    caution_band: 'moderate',
    explanation:
      'Signal-based match with probable overlap in space exploration and artificial intelligence. Requires human judgment.',
    opener_suggestion:
      'Your post about space exploration caught my eye - what pulled you into that space?',
    source_links: ['https://x.com/candidate_one/status/1'],
  },
];

const reviewLog: ReviewLog = {
  run_id: 'run-20260410-elon-live-01',
  reviewer_mode: 'human_required',
  created_at: '2026-04-10T02:00:00Z',
  notes: ['Human review required.'],
  caution_summary: ['@candidate_one: caution band moderate'],
  unknown_summary: ['Relationship certainty remains out of scope; outputs are advisory only.'],
};

describe('professional report builder', () => {
  it('builds contract-shaped professional reports', () => {
    const report = buildProfessionalReport({
      run_id: 'run-20260410-elon-live-01',
      created_at: '2026-04-10T02:00:00Z',
      payload_agents: ['grok', 'perplexity'],
      subject_profile: subjectProfile,
      ranked_matches: rankedMatches,
      review_log: reviewLog,
      contract,
    });

    expect(report.subject_handle).toBe('elonmusk');
    expect(report.payload_agents).toEqual(['grok', 'perplexity']);
    expect(report.ranked_candidates[0]?.handle).toBe('candidate_one');
    expect(report.advisory_boundary).toContain('advisory only');
    expect(report.advisory_boundary).toContain('attraction preference');
  });

  it('renders markdown with required sections', () => {
    const report = buildProfessionalReport({
      run_id: 'run-20260410-elon-live-01',
      created_at: '2026-04-10T02:00:00Z',
      payload_agents: ['grok', 'perplexity'],
      subject_profile: subjectProfile,
      ranked_matches: rankedMatches,
      review_log: reviewLog,
      contract,
    });

    const rendered = renderProfessionalReportMarkdown(report);
    expect(rendered).toContain('## Executive Summary');
    expect(rendered).toContain('## Ranked Candidates');
    expect(rendered).toContain('## Advisory Boundary');
  });
});
