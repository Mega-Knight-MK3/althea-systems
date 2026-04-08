const HOMEPAGE_CONFIG = {
  carousel: {
    slides: [
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
    ],
  },
  intro: {
    body: 'Althea Systems accompagne les professionnels de santé avec un catalogue de matériel médical de pointe, choisi par des praticiens et soutenu par un service après-vente rapide.',
    stats: [
      { id: 'expertise', value: '15', label: 'ans d’expertise' },
      { id: 'cabinets', value: '2000+', label: 'cabinets équipés' },
      { id: 'sav', value: '48h', label: 'vitesse de réponse SAV' },
    ],
  },
  featuredProductSlugs: [] as string[],
}

export default class SiteConfigController {
  async homepage() {
    return HOMEPAGE_CONFIG
  }
}
