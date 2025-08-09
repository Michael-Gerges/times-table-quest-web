const KEY = 'mult_memory_v1';

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
