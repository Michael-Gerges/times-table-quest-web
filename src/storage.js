const KEY = 'mult_memory_v1';
const LOG_KEY = 'usage_logs_v1';

/** Load stored data object. */
export function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

/** Save data object. */
export function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

/** Clear stored data. */
export function clear() {
  localStorage.removeItem(KEY);
}

export { KEY as STORAGE_KEY };

/** Append a submission log entry. */
export function appendSubmission(entry) {
  try {
    const logs = JSON.parse(localStorage.getItem(LOG_KEY)) || [];
    logs.push(entry);
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch {
    /* ignore */
  }
  try {
    if (typeof fetch === 'function') {
      fetch('/.netlify/functions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}
