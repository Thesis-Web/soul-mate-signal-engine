# soul-mate-signal-engine

Version: 0.1.0
Status: bootstrap baseline
Date: 2026-04-09

## Purpose

This repository is the deterministic build anchor for a public-signal compatibility engine that evaluates public X and web signals and turns them into ranked, reviewable compatibility briefs.

Brand-facing name:
Soul Mate Signal Engine

Internal operating name:
Public Compatibility Signal Engine

## Operating stance

- AI-first
- human-supervised
- deterministic where possible
- schema-first
- evidence-first
- replay-oriented
- advisory only
- public-signal only

## Hard boundaries

- public data only
- no private scraping
- no certainty claims about love, destiny, or relationship truth
- no protected-attribute targeting
- no minor matching
- no doxxing
- no coercive or manipulative opener generation
- all outputs remain advisory and reviewable

## Initial bootstrap scope

This baseline establishes:

- repository structure
- formatter and markdown lint
- TypeScript strict mode
- basic unit test harness
- CI workflow
- runtime contract and JSON schemas
- validation scripts
- dry-run and agent-ingest execution paths
- professional report output contract
- operator kickoff and prompt-prep flow

## Planned runtime flow

Ingest
Normalize
Extract
Discover
Score
Explain
Emit

## Initial gates

Current CI gate enforces:

- prettier format check
- markdown lint
- JSON and YAML parse validation
- repository structure validation
- schema placeholder validation
- artifact filename validation
- TypeScript typecheck
- unit tests

## Repository shape

- docs
- prompts
- schemas
- templates
- manifests
- logs
- runs
- outputs
- scripts
- src
- tests

## Live-run operator commands

Kickoff prompt only:

    npm run run:prepare

Subject-ready prompt packet:

    npm run run:prepare -- --subject "Elon Musk"

Ingest run from external agent payloads:

    npm run run:ingest -- \
      --run-id run-20260410-elon-live-01 \
      --created-at 2026-04-10T02:00:00Z \
      --payload path/to/grok.json \
      --payload path/to/perplexity.json

## Successful ingest artifacts

Required:

- 01-subject-profile.json
- 02-candidate-pool.json
- 03-audited-signal-set.json
- 04-match-scorecard.json
- 05-output-brief.md
- 06-review-log.json

Optional:

- 07-opener-pack.json
- 08-run-metrics.json
- 09-professional-report.json
- 10-professional-report.md

## Next build order

1. Canonical blueprint
2. Canonical engineering spec
3. Runtime contract and JSON schemas
4. Agent input and output types
5. Discovery and scoring pipeline
6. Artifact builders
7. Review gates
8. Dry-run execution path
