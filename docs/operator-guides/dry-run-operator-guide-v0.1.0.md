# Dry Run Operator Guide

## Operator-first flow

1. Drop the repository zip.
2. Run `npm run run:prepare` with no arguments.
3. The engine responds with the kickoff question: `Ok, I have loaded the engine. Who is our subject today?`
4. Supply the subject name or X handle.
5. Optionally provide explicit operator context if you already know the romantic-fit boundary, for example `interested in women`, `interested in men`, `open to any gender`, or `unknown`.
6. Send the generated Grok and Perplexity payloads back into the engine.
7. Run ingest and review the JSON, Markdown, and PDF artifacts.

## Important boundary

The engine does not run a "gaydar" and does not infer sexual orientation or attraction preference from ambiguity.
It uses explicit operator context or explicit recent public self-description only.
Anything else stays `romantic_fit_status: unknown`.

## Prepare examples

Kickoff only:

    npm run run:prepare

Subject and explicit operator context:

    npm run run:prepare -- --subject "Jane Doe" --operator-context "subject is interested in men"

## Ingest example

    npm run run:ingest --       --run-id run-20260410-jane-live-01       --created-at 2026-04-10T02:00:00Z       --payload path/to/grok.json       --payload path/to/perplexity.json

## Report outputs

The ingest path emits:

- professional report JSON
- professional report Markdown
- professional report PDF

The PDF is the user-facing deliverable.
