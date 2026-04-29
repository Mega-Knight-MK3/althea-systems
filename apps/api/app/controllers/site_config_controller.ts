import HomepageSlide from '#models/homepage_slide'
import SiteSetting from '#models/site_setting'
import { INTRO_BODY_KEY } from '#controllers/admin_homepage_controller'

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
  async homepage() {
    const [dbSlides, intro] = await Promise.all([
      HomepageSlide.query().where('isActive', true).orderBy('position', 'asc'),
      SiteSetting.find(INTRO_BODY_KEY),
    ])

    const slides = dbSlides.length > 0
      ? dbSlides.map((s) => ({
          id: s.id,
          eyebrow: s.eyebrow ?? '',
          title: s.title,
          body: s.body ?? '',
          ctaLabel: s.ctaLabel ?? '',
          ctaUrl: s.ctaUrl ?? '',
          imageUrl: s.imageUrl ?? '',
        }))
      : FALLBACK_SLIDES

    return {
      carousel: { slides },
      intro: {
        body: intro?.value || FALLBACK_INTRO_BODY,
        stats: [
          { id: 'expertise', value: '15', label: 'ans d’expertise' },
          { id: 'cabinets', value: '2000+', label: 'cabinets équipés' },
          { id: 'sav', value: '48h', label: 'vitesse de réponse SAV' },
        ],
      },
      featuredProductSlugs: [] as string[],
    }
  }
}
