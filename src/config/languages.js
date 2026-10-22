export const SOURCE_LANGUAGE = Object.freeze({
  code: "en",
  name: "English",
  nllb: "eng_Latn",
});

/** Only languages supported by the NLLB-200 translation model are offered. */
export const TARGET_LANGUAGES = Object.freeze([
  { code: "mi", name: "Te Reo Māori", nllb: "mri_Latn" },
  { code: "sm", name: "Samoan", nllb: "smo_Latn" },
  { code: "hi", name: "Hindi", nllb: "hin_Deva" },
  { code: "ja", name: "Japanese", nllb: "jpn_Jpan", unspaced: true },
  { code: "zh", name: "Chinese (Simplified)", nllb: "zho_Hans", unspaced: true },
  { code: "ar", name: "Arabic", nllb: "arb_Arab", rtl: true },
  { code: "es", name: "Spanish", nllb: "spa_Latn" },
  { code: "fr", name: "French", nllb: "fra_Latn" },
]);

export const DEFAULT_TARGET_CODE = "mi";

const ALL_LANGUAGES = [SOURCE_LANGUAGE, ...TARGET_LANGUAGES];

export const SUPPORTED_LANGUAGE_CODES = ALL_LANGUAGES.map((l) => l.code);
export const TARGET_LANGUAGE_CODES = TARGET_LANGUAGES.map((l) => l.code);

export function getLanguage(code) {
  return ALL_LANGUAGES.find((l) => l.code === code) ?? null;
}
