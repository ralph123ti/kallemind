// NOTE: this file now only holds language *metadata* for the language-picker
// screen and country-based auto-detection. The actual translated strings
// live in src/i18n/locales/*.json and are loaded through i18next
// (see src/i18n/index.ts). This avoids keeping two separate translation
// systems in sync.

export type LanguageCode = 'en' | 'sn' | 'nd';

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'sn', name: 'Shona', flag: '🇿🇼', nativeName: 'ChiShona' },
  { code: 'nd', name: 'Ndebele', flag: '🇿🇼', nativeName: 'IsiNdebele' },
];

// Country to language mapping for auto-detection.
// Only Zimbabwe maps to a non-English default here — Shona is used as the
// baseline since it's the most widely spoken, but Ndebele speakers can
// switch manually in the language picker. Every other country falls back
// to English (the app's default — see src/i18n/index.ts).
export const COUNTRY_TO_LANGUAGE: Record<string, LanguageCode> = {
  'Zimbabwe': 'sn',
};