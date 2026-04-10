import { spawn } from 'node:child_process';
import path from 'node:path';

export async function renderProfessionalReportPdf(input: {
  reportJsonPath: string;
  outputPdfPath: string;
}): Promise<void> {
  const scriptPath = path.resolve('scripts/render-professional-report-pdf.py');

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'python3',
      [scriptPath, '--report-json', input.reportJsonPath, '--output-pdf', input.outputPdfPath],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const detail = stderr.trim();
      reject(
        new Error(
          detail.length > 0
            ? `PDF render failed: ${detail}`
            : `PDF render failed with exit code ${String(code)}.`,
        ),
      );
    });
  });
}
