import { describe, it, expect } from 'vitest';

// Replicate the transform logic from getHistory() in Code.gs
function transformHistoryRecord(
  r: { date: string; synced?: number; updated?: number; errors?: number },
  _i: number
) {
  const filesProcessed = (r.synced || 0) + (r.updated || 0);
  const status =
    r.errors && r.errors > 0
      ? filesProcessed > 0
        ? 'partial'
        : 'error'
      : 'success';
  const message =
    (r.synced || 0) +
    ' synced, ' +
    (r.updated || 0) +
    ' updated' +
    (r.errors ? ', ' + r.errors + ' errors' : '');
  return {
    id: r.date,
    timestamp: r.date,
    filesProcessed,
    status,
    message,
  };
}

describe('getHistory transform', () => {
  it('maps a successful sync run correctly', () => {
    const result = transformHistoryRecord(
      { date: '2025-01-01T00:00:00.000Z', synced: 5, updated: 2, errors: 0 },
      0
    );
    expect(result.id).toBe('2025-01-01T00:00:00.000Z');
    expect(result.timestamp).toBe('2025-01-01T00:00:00.000Z');
    expect(result.filesProcessed).toBe(7);
    expect(result.status).toBe('success');
    expect(result.message).toBe('5 synced, 2 updated');
  });

  it('returns partial status when there are errors but some files synced', () => {
    const result = transformHistoryRecord(
      { date: '2025-01-01T00:00:00.000Z', synced: 3, updated: 0, errors: 2 },
      0
    );
    expect(result.status).toBe('partial');
    expect(result.message).toContain('2 errors');
  });

  it('returns error status when no files synced and there are errors', () => {
    const result = transformHistoryRecord(
      { date: '2025-01-01T00:00:00.000Z', synced: 0, updated: 0, errors: 5 },
      0
    );
    expect(result.status).toBe('error');
    expect(result.filesProcessed).toBe(0);
  });

  it('handles undefined synced/updated/errors gracefully', () => {
    const result = transformHistoryRecord({ date: '2025-01-01T00:00:00.000Z' }, 0);
    expect(result.filesProcessed).toBe(0);
    expect(result.status).toBe('success');
    expect(result.message).toBe('0 synced, 0 updated');
  });
});
