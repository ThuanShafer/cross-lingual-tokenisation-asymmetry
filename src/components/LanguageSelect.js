"use client";

import { TARGET_LANGUAGES } from "@/config/languages";

export function LanguageSelect({ value, onChange, disabled }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Comparison language</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none rounded-lg border border-amber-400/60 bg-amber-400/10 py-1.5 pl-3 pr-9 text-lg font-semibold text-amber-300 outline-none transition hover:bg-amber-400/20 focus-visible:ring-2 focus-visible:ring-amber-300 disabled:opacity-50"
      >
        {TARGET_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
            {lang.name}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 size-3.5 text-amber-300" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </label>
  );
}
