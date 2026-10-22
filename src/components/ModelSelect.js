"use client";

export function ModelSelect({ models, value, onChange, disabled, error }) {
  if (!models.length) {
    return (
      <p role="alert" className="rounded-full bg-rose-500/15 px-4 py-1.5 text-xs text-rose-200">
        {error ?? "No Ollama models installed. Run `ollama pull llama3.2`."}
      </p>
    );
  }

  return (
    <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
      Model
      <span className="relative inline-flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="appearance-none rounded-lg border border-white/20 bg-white/5 py-1.5 pl-3 pr-8 font-mono text-sm normal-case tracking-normal text-white outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
        >
          {models.map((m) => (
            <option key={m.name} value={m.name} className="bg-slate-900">
              {m.parameterSize ? `${m.name} · ${m.parameterSize}` : m.name}
            </option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-2.5 size-3 text-white/60" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    </label>
  );
}
