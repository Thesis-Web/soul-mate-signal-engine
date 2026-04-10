# Romantic Fit and PDF Update v0.1.0

## DIFF-001

Added explicit romantic-fit safeguards.
The engine does not infer orientation or attraction preference.
It accepts `aligned`, `unknown`, and `not_aligned` only from explicit operator context or explicit public self-description.

## DIFF-002

Added professional report PDF output as `11-professional-report.pdf`.
The JSON report remains the source contract and the Markdown report remains the human-readable intermediate.

## DIFF-003

Reframed the acquisition prompts and operator guide toward romantic matching rather than generic social adjacency.
The intended live flow is now:

1. unzip repo
2. run `npm run run:prepare`
3. answer the kickoff question with the subject
4. gather agent payloads
5. run ingest
6. review PDF-first output
