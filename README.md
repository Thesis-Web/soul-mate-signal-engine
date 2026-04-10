# soul-mate-signal-engine

Version: 0.1.0
Status: bootstrap baseline plus romantic-fit and PDF hardening
Date: 2026-04-10

## Purpose

This repository is the deterministic build anchor for a public-signal romantic-compatibility engine that evaluates public X and web signals and turns them into ranked, reviewable compatibility briefs.

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
- no inference of sexual orientation or attraction preference from ambiguity
- all outputs remain advisory and reviewable

## What changed in this update

- operator-first prep flow stays kickoff-first
- prompts now ask agents to look for romantic compatibility rather than generic adjacency
- romantic-fit gating is explicit-context-only, not inferred
- organizations, campaign shells, teams, and family/staff-style adjacencies are excluded from the intended romantic candidate set
- professional report now emits JSON, Markdown, and PDF
- ingest CLI now works against committed manifest files

## Live-run operator commands

Kickoff prompt only:

    npm run run:prepare

Subject-ready prompt packet:

    npm run run:prepare -- --subject "Jane Doe"

Subject-ready prompt packet with explicit operator context:

    npm run run:prepare -- --subject "Jane Doe" --operator-context "subject is interested in men"

Ingest run from external agent payloads:

    npm run run:ingest --       --run-id run-20260410-jane-live-01       --created-at 2026-04-10T02:00:00Z       --payload path/to/grok.json       --payload path/to/perplexity.json

## Professional report artifacts

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
- 11-professional-report.pdf

## PDF dependency

The PDF renderer uses Python ReportLab.

Local install example:

    python3 -m pip install reportlab

## Runtime rule for romantic fit

The engine does not implement or endorse any "gaydar" behavior.
It only accepts romantic-fit alignment when it is backed by:

- explicit operator context, or
- explicit recent public self-description

If that evidence is absent, the candidate stays `unknown` and receives extra caution.
