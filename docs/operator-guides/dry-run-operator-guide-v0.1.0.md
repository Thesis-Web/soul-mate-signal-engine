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

1. collect subject handle
2. collect public profile and recent-post evidence
3. collect candidate discovery evidence
4. collect candidate audit evidence
5. normalize evidence into runtime contract
6. score candidates
7. review cautions and unknowns
8. emit advisory brief

## 5. Required Operator Discipline

The operator should preserve:

- original handle
- source link
- capture time
- exact excerpt when possible
- whether the item is observed signal or inference

## 6. Output Reminder

The output is advisory only and requires human judgment.
