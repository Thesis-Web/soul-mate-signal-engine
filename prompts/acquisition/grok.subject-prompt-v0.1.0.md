# Grok Subject Prompt Template

Produce one JSON object only for subject {{SUBJECT}}.

Use this exact contract:

- dataset_version: 1.0.0
- dataset_type: compatibility_signal_research
- agent_id: grok
- captured_at: ISO-8601 UTC timestamp
- subject: handle, bio, pinned_post_excerpt, recent_posts, interests, humor_style, emotional_tone, relationship_signals, cadence_summary, evidence
- candidates: handle, matched_interests, interest_overlap_score, community_overlap_signals, communication_style, availability_signal, energy_level, caution_flags, disqualifier_flags, spark_indicators, candidate_evidence, audit_evidence

Allowed enums:

- humor_style: dry | absurdist | self_deprecating | wholesome | none
- emotional_tone: optimistic | neutral | venting | melancholic
- communication_style: playful | thoughtful | debative | supportive
- availability_signal: available | unclear | unavailable
- source_class: public_x_profile | public_x_post | public_web_link | human_supplied_public_capture
- evidence_class: observed_public_signal | reasonable_inference | unknown

Discovery rules:

- Prefer 5 to 8 public candidates maximum.
- Prefer topic overlap, discourse overlap, humor/style overlap, and community adjacency.
- Exclude likely bots, brand shells, dead accounts, or parody accounts unless clearly useful and clearly labeled.
- Keep evidence excerpts short.
- Use empty arrays or empty strings where evidence is missing.
- Return JSON only.
