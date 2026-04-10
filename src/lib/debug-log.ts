/**
 * debug-log.ts
 * Lightweight structured debug logger for the Soul Mate Signal Engine.
 * Controlled by the DEBUG_SMSE env var.
 * DEBUG_SMSE=1   → stage headers + key events
 * DEBUG_SMSE=2   → full per-candidate trace
 */

export type DebugLevel = 0 | 1 | 2;

function getLevel(): DebugLevel {
  const raw = process.env['DEBUG_SMSE'];
  if (raw === '2') return 2;
  if (raw === '1') return 1;
  return 0;
}

function ts(): string {
  return new Date().toISOString();
}

function fmt(stage: string, msg: string, data?: unknown): string {
  const dataStr = data !== undefined ? `  ${JSON.stringify(data)}` : '';
  return `[SMSE ${ts()}] [${stage}]  ${msg}${dataStr}`;
}

export function makeDebugLog(runId: string) {
  const level = getLevel();
  const lines: string[] = [];

  function emit(line: string) {
    lines.push(line);
    if (level > 0) process.stderr.write(line + '\n');
  }

  return {
    level,

    stage(name: string) {
      emit(fmt(name, `=== STAGE: ${name} [run=${runId}] ===`));
    },

    info(stage: string, msg: string, data?: unknown) {
      if (level >= 1) emit(fmt(stage, msg, data));
    },

    trace(stage: string, msg: string, data?: unknown) {
      if (level >= 2) emit(fmt(stage, msg, data));
    },

    warn(stage: string, msg: string, data?: unknown) {
      emit(fmt(stage, `⚠ WARN  ${msg}`, data));
    },

    flag(stage: string, flagName: string, reason: string) {
      emit(fmt(stage, `🚩 FLAG  ${flagName}: ${reason}`));
    },

    candidate(stage: string, handle: string, msg: string, data?: unknown) {
      if (level >= 2) emit(fmt(stage, `  [${handle}] ${msg}`, data));
    },

    score(handle: string, base: number, advisory: number, caution: string) {
      if (level >= 1)
        emit(fmt('SCORE', `  [${handle}] base=${base} advisory=${advisory} caution=${caution}`));
    },

    drop(handle: string, reason: string) {
      if (level >= 1) emit(fmt('AUDIT', `  ✗ DROP [${handle}] — ${reason}`));
    },

    keep(handle: string, note: string) {
      if (level >= 2) emit(fmt('AUDIT', `  ✓ KEEP [${handle}] — ${note}`));
    },

    summary(): string[] {
      return [...lines];
    },
  };
}

export type DebugLog = ReturnType<typeof makeDebugLog>;
