# Grok Subject Prompt — v0.2.0

Produce one JSON object only for subject {{SUBJECT}}.

Operator context:
{{OPERATOR_CONTEXT}}

---

## Tone

This is a fun, lighthearted compatibility signal tool — not a surveillance system.
Keep candidate descriptions warm and human. No clinical language.

---

## Contract

- dataset_version: 1.0.0
- dataset_type: compatibility_signal_research
- agent_id: grok
- captured_at: ISO-8601 UTC timestamp

### Subject fields

- handle, bio, pinned_post_excerpt, recent_posts, interests
- humor_style, emotional_tone, relationship_signals, cadence_summary, evidence
- **orientation_signal** — straight | gay | bisexual | unknown
- **gender_signal** — male | female | nonbinary | unknown

### Candidate fields

- handle, matched_interests, interest_overlap_score (0–100)
- community_overlap_signals, communication_style
- availability_signal, **caught_by** (handle of current partner if unavailable, else omit)
- romantic_fit_status, energy_level (0–10)
- caution_flags, disqualifier_flags, spark_indicators
- candidate_evidence, audit_evidence
- **orientation_signal** — straight | gay | bisexual | unknown
- **gender_signal** — male | female | nonbinary | unknown

---

## Allowed enums

- humor_style: dry | absurdist | self_deprecating | wholesome | none
- emotional_tone: optimistic | neutral | venting | melancholic
- communication_style: playful | thoughtful | debative | supportive
- availability_signal: available | unclear | unavailable
- romantic_fit_status: aligned | unknown | not_aligned
- orientation_signal: straight | gay | bisexual | unknown
- gender_signal: male | female | nonbinary | unknown
- source_class: public_x_profile | public_x_post | public_web_link | human_supplied_public_capture
- evidence_class: observed_public_signal | reasonable_inference | unknown

---

## Orientation & gender matching rules — CRITICAL

These rules exist because the previous version was matching straight men with men and
straight women with women. That must not happen.

1. **Read orientation and gender from explicit public signals only** — profile bio,
   explicit posts, interviews, or operator context. Never infer from pronouns alone
   or from who someone follows.

2. **If the subject is a straight man**, prioritize female candidates who publicly
   signal availability or interest in men. Do NOT include male candidates as romantic
   candidates unless operator context or explicit public signals indicate the subject
   is gay or bisexual.

3. **If the subject is a straight woman**, prioritize male candidates who publicly
   signal interest in women. Do NOT include female candidates as romantic candidates
   unless orientation evidence supports it.

4. **If the subject is gay**, prioritize same-gender candidates who publicly signal
   gay or bisexual orientation.

5. **If orientation is unknown**, default to mixed candidate pool but mark
   romantic_fit_status as unknown and orientation_signal as unknown for all candidates.
   Do not assume. Do not infer.

6. **caught_by**: if a candidate is publicly confirmed to be in a relationship,
   include their partner's public handle in the `caught_by` field. Set
   availability_signal to "unavailable". DO NOT drop them from the list —
   the engine will display them with a fun "already caught" label.

7. **Orientation mismatch is not a hard drop** — set romantic_fit_status to
   "not_aligned" and let the scoring engine handle it. The human operator decides.

---

## Discovery rules

- Prefer 5 to 8 candidates maximum.
- Prioritize genuine personality and interest overlap that could support real connection,
  not just topic adjacency.
- Exclude: bots, brand shells, dead accounts, parody accounts, organizations,
  campaign teams. These go in disqualifier_flags.
- Do NOT exclude candidates just because they are unavailable — include them with
  availability_signal: "unavailable" and caught_by if known.
- Keep evidence excerpts short and specific.
- Use empty arrays or empty strings where evidence is missing.
- Return JSON only. No preamble. No markdown fences.
