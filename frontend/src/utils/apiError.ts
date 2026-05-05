import axios from 'axios';

/** Returns a flat human-readable message from a DRF error response. */
export function parseApiError(err: unknown): string {
  if (!axios.isAxiosError(err)) return 'Something went wrong. Please try again.';
  const data = err.response?.data;
  if (!data) return 'Network error. Please check your connection.';
  if (typeof data.detail === 'string') return data.detail;
  // Field-level errors: { email: ['...'], username: ['...'] }
  if (typeof data === 'object') {
    const messages = Object.entries(data)
      .flatMap(([, msgs]) => (Array.isArray(msgs) ? msgs : [String(msgs)]))
      .join(' ');
    if (messages) return messages;
  }
  return 'Something went wrong. Please try again.';
}

/** Returns a map of field → first error string from a DRF validation error. */
export function parseFieldErrors(err: unknown): Record<string, string> {
  if (!axios.isAxiosError(err)) return {};
  const data = err.response?.data;
  if (!data || typeof data !== 'object') return {};
  const result: Record<string, string> = {};
  for (const [field, msgs] of Object.entries(data)) {
    if (Array.isArray(msgs) && msgs.length > 0) result[field] = msgs[0];
    else if (typeof msgs === 'string') result[field] = msgs;
  }
  return result;
}
