import { describe, expect, it } from 'vitest';
import { normalizeHandle, projectMeta } from '../../src/index.js';

describe('projectMeta', () => {
  it('exposes bootstrap metadata', () => {
    expect(projectMeta.name).toBe('soul-mate-signal-engine');
    expect(projectMeta.outputMode).toBe('advisory-only');
  });
});

describe('normalizeHandle', () => {
  it('normalizes plain handles', () => {
    expect(normalizeHandle('@ExNulla')).toBe('exnulla');
  });

  it('normalizes x urls', () => {
    expect(normalizeHandle('https://x.com/SomeUser')).toBe('someuser');
  });

  it('throws on empty input', () => {
    expect(() => normalizeHandle('   ')).toThrow('Handle input is required.');
  });
});
