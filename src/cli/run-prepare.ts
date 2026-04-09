import { readFile } from 'node:fs/promises';
import path from 'node:path';

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function readTemplate(relativePath: string): Promise<string> {
  return readFile(path.resolve(relativePath), 'utf8');
}

function renderTemplate(template: string, subject: string): string {
  return template.replaceAll('{{SUBJECT}}', subject.trim());
}

async function main(): Promise<void> {
  const subject = getArg('--subject')?.trim();

  if (!subject) {
    const kickoff = await readTemplate('prompts/output/operator-kickoff-v0.1.0.md');
    process.stdout.write(kickoff);
    return;
  }

  const grokInstructions = await readTemplate('prompts/acquisition/grok.instructions-v0.1.0.md');
  const grokPrompt = renderTemplate(
    await readTemplate('prompts/acquisition/grok.subject-prompt-v0.1.0.md'),
    subject,
  );
  const perplexityInstructions = await readTemplate(
    'prompts/acquisition/perplexity.instructions-v0.1.0.md',
  );
  const perplexityPrompt = renderTemplate(
    await readTemplate('prompts/acquisition/perplexity.subject-prompt-v0.1.0.md'),
    subject,
  );

  const output = [
    `# Live Run Prep — ${subject}`,
    '',
    '## Operator Kickoff',
    '',
    'Ok, I have loaded the engine. Who is our subject today?',
    '',
    '## Grok Instructions',
    '',
    grokInstructions.trim(),
    '',
    '## Grok Prompt',
    '',
    grokPrompt.trim(),
    '',
    '## Perplexity Instructions',
    '',
    perplexityInstructions.trim(),
    '',
    '## Perplexity Prompt',
    '',
    perplexityPrompt.trim(),
    '',
  ].join('\n');

  process.stdout.write(output);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Prepare run failed: ${message}`);
  process.exit(1);
});
