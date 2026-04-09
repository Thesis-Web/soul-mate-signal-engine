# Dry Run Operator Guide

version: 0.1.0
status: draft

## 1. Purpose

This guide describes how to operate the engine before direct live retrieval is wired into the runtime.

## 2. Operator Model

The human operator supplies public live-signal material from external tools.
The engine normalizes, audits, scores, and emits review artifacts.

## 3. Allowed Operator Inputs

Allowed:

- subject handle
- subject URL
- public post excerpts
- public profile excerpts
- public linked material
- candidate lists with source links

Not allowed:

- private messages
- private screenshots from locked accounts
- personal data broker dumps
- hidden or non-public sources

## 4. Recommended Dry-Run Sequence

1. run `npm run run:prepare` to get the kickoff prompt
2. run `npm run run:prepare -- --subject "<subject>"` to emit Grok and Perplexity instructions plus prompts
3. paste the versioned instructions into the external tool once and wait for `acknowledged`
4. paste the subject-specific prompt into each external tool
5. collect the returned JSON payloads without editing field names
6. run `npm run run:ingest` with the payload paths
7. review cautions, unknowns, and the professional report
8. decide whether a new corroboration pass is required

## 5. Required Operator Discipline

The operator should preserve:

- original handle
- source link
- capture time
- exact excerpt when possible
- whether the item is observed signal or inference

## 6. Output Reminder

The output is advisory only and requires human judgment.
