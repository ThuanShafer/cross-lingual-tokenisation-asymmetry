const STORAGE_KEY = "tokenization-asymmetry:findings:v1";
const EMPTY = Object.freeze([]);
const listeners = new Set();

let cache = null;

function read() {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY)) ?? EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(findings) {
  cache = findings;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(findings));
  listeners.forEach((listener) => listener());
}

/**
 * Session findings: one entry per (model, target language), so re-running a
 * language replaces its earlier result. Persisted in localStorage so the
 * report tab sees the same data.
 */
export const findingsStore = {
  getSnapshot: read,
  getServerSnapshot: () => EMPTY,
  subscribe(listener) {
    listeners.add(listener);
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      cache = null;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  save(finding) {
    const others = read().filter((f) => !(f.model.name === finding.model.name && f.target.code === finding.target.code));
    write([...others, finding]);
  },
  update(id, patch) {
    write(read().map((f) => (f.id === id ? { ...f, ...patch } : f)));
  },
  remove(id) {
    write(read().filter((f) => f.id !== id));
  },
  clear() {
    write(EMPTY);
  },
};
