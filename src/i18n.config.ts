
export const i18n = {
  defaultLocale: 'es',
  locales: ['es', 'en', 'fr', 'de', 'it'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

export const localeNames: { [key in Locale]: string } = {
    es: 'Español',
    en: 'English',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
};

export const localeToAILanguage: { [key in Locale]: string } = {
    es: 'Spanish',
    en: 'English',
    fr: 'French',
    de: 'German',
    it: 'Italian',
}
