import type { HttpContext } from '@adonisjs/core/http'
import HomepageSlide, { type SlideLocaleFields } from '#models/homepage_slide'
import SiteSetting from '#models/site_setting'
import { INTRO_BODY_KEY } from '#controllers/admin_homepage_controller'

const SUPPORTED_LOCALES = ['fr', 'en', 'ar'] as const
type Locale = (typeof SUPPORTED_LOCALES)[number]
const DEFAULT_LOCALE: Locale = 'fr'

const FALLBACK_SLIDES = [
  {
    id: 1,
    eyebrow: 'Nouveauté',
    title: 'Stéthoscopes électroniques nouvelle génération',
    body: 'Une qualité audio inégalée pour des diagnostics précis au cabinet.',
    ctaLabel: 'Découvrir la collection',
    ctaUrl: '/categories/stethoscopes',
    imageUrl: '',
  },
  {
    id: 2,
    eyebrow: 'Engagement',
    title: 'Service après-vente sous 48 heures partout en France',
    body: 'Un cabinet ne peut pas attendre. Nos équipes interviennent rapidement.',
    ctaLabel: 'En savoir plus',
    ctaUrl: '/contact',
    imageUrl: '',
  },
  {
    id: 3,
    eyebrow: 'Sélection',
    title: 'Le matériel essentiel pour ouvrir votre cabinet',
    body: 'Nos experts ont composé une sélection prête à l’emploi.',
    ctaLabel: 'Voir la sélection',
    ctaUrl: '/categories/cabinet-medical',
    imageUrl: '',
  },
]

const FALLBACK_INTRO_BODY =
  'Althea Systems accompagne les professionnels de santé avec un catalogue de matériel médical de pointe, choisi par des praticiens et soutenu par un service après-vente rapide.'

export default class SiteConfigController {
  async homepage({ request }: HttpContext) {
    const locale = pickLocale(request.header('accept-language'))

    const [dbSlides, intro] = await Promise.all([
      HomepageSlide.query().where('isActive', true).orderBy('position', 'asc'),
      SiteSetting.find(INTRO_BODY_KEY),
    ])

    const slides =
      dbSlides.length > 0
        ? dbSlides.map((s) => {
            const localized = pickSlideTranslation(s.translations, locale)
            return {
              id: s.id,
              eyebrow: localized.eyebrow ?? s.eyebrow ?? '',
              title: localized.title ?? s.title,
              body: localized.body ?? s.body ?? '',
              ctaLabel: localized.ctaLabel ?? s.ctaLabel ?? '',
              ctaUrl: s.ctaUrl ?? '',
              imageUrl: s.imageUrl ?? '',
            }
          })
        : FALLBACK_SLIDES

    const introBody = intro
      ? intro.translations?.[locale] || intro.value || FALLBACK_INTRO_BODY
      : FALLBACK_INTRO_BODY

    return {
      carousel: { slides },
      intro: {
        body: introBody,
      },
      featuredProductSlugs: [] as string[],
    }
  }
}

function pickLocale(header: string | string[] | undefined): Locale {
  if (!header) return DEFAULT_LOCALE
  const raw = Array.isArray(header) ? header[0] : header
  const candidate = raw?.split(',')[0]?.split('-')[0]?.toLowerCase()
  return SUPPORTED_LOCALES.includes(candidate as Locale)
    ? (candidate as Locale)
    : DEFAULT_LOCALE
}

function pickSlideTranslation(
  translations: Record<string, SlideLocaleFields> | undefined,
  locale: Locale
): SlideLocaleFields {
  if (!translations || locale === DEFAULT_LOCALE) return {}
  return translations[locale] ?? {}
}
