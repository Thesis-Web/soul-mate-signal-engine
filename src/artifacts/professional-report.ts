import { assertNarrativeSupport } from './evidence-builder.js';
import type {
  ProfessionalReport,
  ProfessionalReportContract,
  ProfessionalReportMatch,
  ReviewLog,
} from '../types/artifacts.js';
import type { RankedMatch, SubjectProfile } from '../types/runtime-contract.js';

function normalizeLine(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function buildExecutiveSummary(subject: SubjectProfile, rankedMatches: RankedMatch[]): string {
  const topMatch = rankedMatches[0];

  if (!topMatch) {
    return `Signal-based romantic-compatibility run for @${subject.handle} completed with no candidates surviving the current ingest and review filters. Requires human judgment.`;
  }

  return normalizeLine(
    `Signal-based romantic-compatibility run for @${subject.handle} completed with ${rankedMatches.length} ranked candidate(s). ` +
      `Top candidate @${topMatch.handle} scored ${topMatch.compatibility_score} with a ${topMatch.caution_band} caution band. ` +
      `This remains an advisory fit and requires human judgment.`,
  );
}

function buildSubjectSignalSummary(subject: SubjectProfile): string {
  const interests =
    subject.interests.slice(0, 4).join(', ') || 'no strong repeated interests captured';
  return normalizeLine(
    `Observed public-signal themes for @${subject.handle} include ${interests}. ` +
      `Humor style was normalized as ${subject.humor_style}, emotional tone as ${subject.emotional_tone}, ` +
      `and cadence as ${subject.cadence_summary || 'not yet richly described'}. ` +
      `Romantic-fit gating uses explicit operator context or explicit public self-description only.`,
  );
}

function buildNextActions(rankedMatches: RankedMatch[]): string[] {
  if (rankedMatches.length === 0) {
    return [
      'Collect another acquisition pass with stronger public candidate evidence.',
      'Review subject evidence for stale or contradictory signals before re-running.',
      'Do not infer attraction preference or orientation without explicit operator or public evidence.',
    ];
  }

  return [
    'Review the top three ranked candidates for stale, contradictory, or media-distorted evidence.',
    'Use the opener pack only after a human reviews availability, romantic fit, and caution flags.',
    'If cross-tool disagreement remains high, collect a fresh corroboration pass before outreach.',
  ];
}

export function buildProfessionalReport(input: {
  run_id: string;
  created_at: string;
  payload_agents: string[];
  subject_profile: SubjectProfile;
  ranked_matches: RankedMatch[];
  review_log: ReviewLog;
  contract: ProfessionalReportContract;
}): ProfessionalReport {
  const runId = input.run_id.trim();
  const createdAt = input.created_at.trim();

  if (runId.length === 0) {
    throw new Error('run_id is required.');
  }

  if (createdAt.length === 0) {
    throw new Error('created_at is required.');
  }

  assertNarrativeSupport(input.subject_profile.evidence_items);

  const rankedCandidates: ProfessionalReportMatch[] = input.ranked_matches
    .slice(0, input.contract.max_ranked_candidates)
    .map((match) => ({
      rank: match.rank,
      handle: match.handle,
      compatibility_score: match.compatibility_score,
      caution_band: match.caution_band,
      explanation: normalizeLine(match.explanation),
      opener_suggestion: normalizeLine(match.opener_suggestion),
      source_links: [...match.source_links],
    }));

  return {
    run_id: runId,
    created_at: createdAt,
    operator_mode: input.contract.operator_mode,
    subject_handle: input.subject_profile.handle,
    payload_agents: [...new Set(input.payload_agents)],
    executive_summary: buildExecutiveSummary(input.subject_profile, input.ranked_matches),
    subject_signal_summary: buildSubjectSignalSummary(input.subject_profile),
    ranked_candidates: rankedCandidates,
    cautions_and_unknowns: [
      ...input.review_log.caution_summary,
      ...input.review_log.unknown_summary,
    ],
    operator_next_actions: buildNextActions(input.ranked_matches),
    advisory_boundary:
      'This output is advisory only, based on public signals, and must not be treated as certainty about compatibility, availability, attraction preference, orientation, or relationship truth.',
  };
}

export function renderProfessionalReportMarkdown(report: ProfessionalReport): string {
  const lines = [
    `# Professional Run Report - ${report.run_id}`,
    '',
    `Subject: @${report.subject_handle}`,
    `Created at: ${report.created_at}`,
    `Operator mode: ${report.operator_mode}`,
    `Payload agents: ${report.payload_agents.join(', ') || 'unknown'}`,
    '',
    '## Executive Summary',
    '',
    report.executive_summary,
    '',
    '## Subject Signal Summary',
    '',
    report.subject_signal_summary,
    '',
    '## Ranked Candidates',
    '',
  ];

  if (report.ranked_candidates.length === 0) {
    lines.push('No ranked candidates were emitted in this run.');
    lines.push('');
  } else {
    for (const candidate of report.ranked_candidates) {
      lines.push(
        `### ${candidate.rank}. @${candidate.handle} - ${candidate.compatibility_score} (${candidate.caution_band})`,
      );
      lines.push('');
      lines.push(`- Explanation: ${candidate.explanation}`);
      lines.push(`- Opener: ${candidate.opener_suggestion}`);
      lines.push('- Source links:');
      for (const link of candidate.source_links) {
        lines.push(`  - ${link}`);
      }
      lines.push('');
    }
  }

  lines.push('## Cautions and Unknowns');
  lines.push('');
  for (const item of report.cautions_and_unknowns) {
    lines.push(`- ${item}`);
  }
  lines.push('');
  lines.push('## Operator Next Actions');
  lines.push('');
  for (const item of report.operator_next_actions) {
    lines.push(`- ${item}`);
  }
  lines.push('');
  lines.push('## Advisory Boundary');
  lines.push('');
  lines.push(report.advisory_boundary);
  lines.push('');

  return `${lines.join('\n')}\n`;
}
