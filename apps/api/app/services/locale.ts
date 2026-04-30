export const SUPPORTED_LOCALES = ['fr', 'en', 'ar'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'fr'

export function pickLocale(header: string | string[] | undefined): Locale {
  if (!header) return DEFAULT_LOCALE
  const raw = Array.isArray(header) ? header[0] : header
  const candidate = raw?.split(',')[0]?.split('-')[0]?.toLowerCase()
  return SUPPORTED_LOCALES.includes(candidate as Locale)
    ? (candidate as Locale)
    : DEFAULT_LOCALE
}

export interface NamedLocaleFields {
  name?: string | null
  description?: string | null
}

export type NamedTranslations = Partial<Record<Locale, NamedLocaleFields>>

export function localizeNamed<T extends { name: string; description: string | null; translations?: NamedTranslations | null }>(
  row: T,
  locale: Locale
): { name: string; description: string | null } {
  if (locale === DEFAULT_LOCALE) {
    return { name: row.name, description: row.description }
  }
  const t = row.translations?.[locale]
  return {
    name: t?.name?.trim() ? t.name : row.name,
    description: t?.description?.trim() ? t.description : row.description,
  }
}
