# Soul Mate Signal Engine Engineering Spec

version: 0.1.0
status: draft
system_name: Public Compatibility Signal Engine
repo_name: soul-mate-signal-engine

## 1. Purpose

This engineering spec defines the draft implementation contract for the public-signal compatibility engine.

This spec governs:

- runtime structure
- data contracts
- scoring contract
- artifact naming
- validation gates
- dry-run operator mode

## 2. Scope

In scope for initial build:

- subject handle normalization
- public-signal profile extraction contract
- candidate discovery contract
- signal audit contract
- weighted compatibility scoring
- advisory output generation
- review artifacts
- dry-run operator workflow using human-provided retrieval

Out of scope for initial build:

- direct private messaging
- private account access
- relationship prediction certainty
- mobile app
- web portal
- monetization workflow
- autonomous outreach

## 3. Source Boundary

Allowed source classes:

- public X profile metadata
- public X posts
- public reply and quote context where accessible
- public linked web material
- human-provided live-signal captures in dry-run mode

Disallowed source classes:

- direct messages
- non-public account content
- credentialed scraping outside approved public interfaces
- purchased people-data brokers
- inferred precise location from weak hints

## 4. Runtime Stage Contract

The runtime shall execute in this order:

1. Ingest
2. Normalize
3. Extract
4. Discover
5. Audit
6. Score
7. Explain
8. Emit

No stage may be silently skipped.

## 5. Primary Runtime Records

### 5.1 SubjectInput

Required fields:

- subject_input
- input_type
- collected_at

Allowed input_type values:

- handle
- x_url

### 5.2 SubjectProfile

Required fields:

- handle
- profile_bio
- pinned_post_excerpt
- recent_posts
- interests
- humor_style
- emotional_tone
- relationship_signals
- cadence_summary
- evidence_items

### 5.3 CandidateMatch

Required fields:

- handle
- matched_interests
- interest_overlap_score
- community_overlap_signals
- evidence_items

### 5.4 AuditedSignal

Required fields:

- handle
- communication_style
- availability_signal
- energy_level
- caution_flags
- disqualifier_flags
- spark_indicators
- evidence_items

### 5.5 RankedMatch

Required fields:

- rank
- handle
- compatibility_score
- dimension_scores
- evidence_strength
- recency_strength
- caution_band
- explanation
- opener_suggestion
- source_links

## 6. Evidence Contract

Each evidence item shall contain:

- evidence_id
- source_class
- source_url or source_reference
- observed_text_excerpt
- observed_at if available
- evidence_class

Allowed evidence_class values:

- observed_public_signal
- reasonable_inference
- unknown

No output narrative may cite unknown as support.

## 7. Scoring Contract

The default score model shall use the following weights:

- interest_overlap: 20
- humor_style_resonance: 15
- values_alignment: 15
- social_tempo: 10
- relationship_signal_compatibility: 10
- emotional_tone_fit: 10
- community_adjacency: 10
- reciprocity_probability: 10

Total:
100

The runtime shall also compute:

- evidence_strength_score
- recency_strength_score
- uncertainty_penalty
- final_caution_band

## 8. Uncertainty Contract

The runtime shall reduce confidence when:

- evidence count is low
- evidence is stale
- overlap comes from only one topic cluster
- relationship-intent evidence is absent
- candidate activity is too sparse
- candidate appears promotional or automated

## 9. Disqualification Contract

A candidate shall be filtered when:

- evidence strongly suggests the account is a bot
- evidence strongly suggests the account is inactive
- evidence strongly suggests the account is coupled and unavailable
- evidence strongly suggests unsafe, abusive, or manipulative behavior
- evidence is too thin to support ranking

## 10. Output Language Gate

The output validator shall reject language such as:

- soulmate confirmed
- perfect match
- guaranteed fit
- destined
- definitely single
- relationship certainty
- love certainty

The output validator shall allow language such as:

- signal-based match
- probable overlap
- advisory fit
- possible conversation match
- evidence-backed resonance
- requires human judgment

## 11. Artifact Naming Contract

Run artifact names shall use the blueprint order:

- 00-failure-log.json
- 01-subject-profile.json
- 02-candidate-pool.json
- 03-audited-signal-set.json
- 04-match-scorecard.json
- 05-output-brief.md
- 06-review-log.json
- 07-opener-pack.json
- 08-run-metrics.json

Only 00 is failure-only.
01 through 06 are expected for successful runs.
07 and 08 are optional.

## 12. Validation Gates

The initial validation gates shall be:

1. formatting
2. markdown lint
3. JSON and YAML parse validation
4. repository structure validation
5. schema placeholder validation
6. artifact filename validation
7. typecheck
8. unit tests

Planned later gates:

- JSON Schema validation
- evidence contract validation
- scoring weight sum validation
- banned language validation
- deterministic replay validation
- stale-signal threshold validation

## 13. Dry-Run Operator Mode

Dry-run operator mode shall permit a human to provide retrieved live-signal material from external tools.

In dry-run operator mode:

- the human is the retrieval interface
- the engine still normalizes and scores deterministically
- every externally supplied evidence item must preserve provenance
- no externally supplied evidence may be treated as private or hidden

## 14. Build Order

Next implementation order after this draft spec is approved:

1. JSON Schemas
2. TypeScript runtime types
3. evidence record builders
4. score model
5. artifact emitters
6. banned-language validator
7. dry-run runner
8. test fixtures and replay samples

## 15. Current State

This engineering spec is draft only.
No runtime contract is canon until owner review and approval.
