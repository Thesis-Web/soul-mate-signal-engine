# Soul Mate Signal Engine Blueprint

version: 0.1.0
status: draft
system_name: Public Compatibility Signal Engine
brand_name: Soul Mate Signal Engine

## 1. Purpose

This repository defines a deterministic, reviewable, public-signal compatibility engine that evaluates public X and web signals and produces advisory compatibility briefs.

The machine does not determine love, destiny, relationship truth, or partner worth.
The machine produces ranked public-signal compatibility suggestions for human review.

## 2. Product Identity

Brand-facing name:
Soul Mate Signal Engine

Internal operating name:
Public Compatibility Signal Engine

The internal operating name governs schema language, artifact language, and validation language.

## 3. Assertion Boundary

The machine MAY assert:

- public post observed
- profile field observed
- topic overlap observed
- cadence overlap observed
- evidence missing
- evidence contradictory
- evidence stale
- compatibility score computed from configured weights
- uncertainty elevated due to thin evidence

The machine MAY infer:

- humor/style resonance
- likely conversation fit
- likely topic persistence
- probable reciprocity conditions
- probable social tempo compatibility

The machine MUST NOT assert:

- soulmate truth
- romantic certainty
- sexual compatibility certainty
- relationship status certainty unless explicitly public and recent
- protected-attribute targeting
- any conclusion derived from private or non-public signals

## 4. Hard Safety Boundary

This system is public-signal only.

The system shall not:

- access private messages
- scrape locked/private accounts
- infer or target minors
- dox or triangulate private location
- optimize for coercion or manipulation
- rank by protected classes or sensitive traits
- emit certainty language such as perfect match, soulmate confirmed, guaranteed fit, destiny, meant to be

Allowed output language:

- advisory
- signal-based
- probable
- possible fit
- evidence-backed overlap
- requires human judgment
- low confidence
- elevated uncertainty

## 5. Runtime Flow

The runtime flow is fixed:

Ingest
Normalize
Extract
Discover
Audit
Score
Explain
Emit

All stages are mandatory in the full build.
Dry-run operator mode may substitute human-provided live retrieval for direct API retrieval, but shall preserve stage ordering.

## 6. Evidence Classes

Every output statement shall belong to one of three evidence classes:

1. Observed Public Signal
   Directly supported by public post text, public profile text, or public linked material.

2. Reasonable Inference
   A constrained inference supported by multiple observed public signals.

3. Unknown
   Anything not supported strongly enough for observed signal or reasonable inference.

The engine shall never blur these classes.

## 7. Agent Architecture

The architecture is a four-agent pipeline.

### Agent 1 — Subject Profile Extractor

Purpose:
Build the subject profile from public signals.

Core duties:

- normalize handle or URL input
- collect public profile text
- collect pinned signal if present
- collect recent public posts
- extract topics, tone, humor style, posting cadence, relationship-intent signals
- produce evidence-linked subject profile

### Agent 2 — Candidate Discovery

Purpose:
Build a candidate pool from topic, community, and discourse overlap.

Core duties:

- search for accounts with overlapping interests
- search adjacent communities and subcultures
- score raw overlap before personality audit
- deduplicate handles
- preserve evidence links

### Agent 3 — Signal Auditor

Purpose:
Filter and normalize candidate quality and safety.

Core duties:

- reject likely bots or promo shells
- reject dead or low-evidence accounts
- reject coupled or unavailable candidates when recent public evidence is strong
- reject manipulative or unsafe suggestions
- reject candidates supported only by weak inference
- produce audited personality and availability signal set

### Agent 4 — Match Scorer and Output Compiler

Purpose:
Compute weighted compatibility and generate reviewable briefs.

Core duties:

- merge subject profile, candidate overlap, and audited signal set
- compute weighted dimension scores
- apply uncertainty penalties
- rank results
- generate explanation and opener guidance
- emit advisory output artifacts

## 8. Scoring Law

Compatibility scoring shall be multi-dimensional, not a single magic number.

Default dimensions:

- interest overlap
- humor/style resonance
- values alignment from explicit public signals only
- social tempo
- relationship-intent compatibility from public signals only
- emotional tone fit
- community adjacency
- reciprocity probability

The engine shall also emit:

- evidence strength
- recency strength
- risk or caution band
- unknowns

The default score shall be configurable, but every configured weight must sum to 100.

## 9. Output Posture

The engine output is advisory-only.

Each ranked match shall include:

- candidate handle
- compatibility score
- evidence-backed reasons
- top overlapping interests
- caution notes
- uncertainty notes
- opener suggestion
- source links

Each run shall also emit a review packet suitable for human inspection.

## 10. Artifact Law

Each run should ultimately emit the following artifacts:

- 01-subject-profile.json
- 02-candidate-pool.json
- 03-audited-signal-set.json
- 04-match-scorecard.json
- 05-output-brief.md
- 06-review-log.json

Optional:

- 07-opener-pack.json
- 08-run-metrics.json

Failure:

- 00-failure-log.json

## 11. Human Role

The human remains the final reviewer.

The engine ranks public-signal possibilities.
The human determines whether any candidate should be acted on, contacted, ignored, or rejected.

## 12. Current Build Phase

Current phase:
Draft law lock

This blueprint is not yet canon.
It is the first draft build law for review before runtime contracts and schemas are implemented.
