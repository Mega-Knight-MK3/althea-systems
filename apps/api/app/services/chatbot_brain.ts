interface FaqEntry {
  intent: string
  keywords: string[]
  answer: string
  suggestions?: string[]
}

const FAQ: FaqEntry[] = [
  {
    intent: 'address-change',
    keywords: ['adresse', 'livraison', 'changer', 'modifier'],
    answer:
      "Vous pouvez modifier vos adresses depuis votre espace client, rubrique « Mes adresses ». Toute commande passée garde l'adresse choisie au moment de l'achat.",
  },
  {
    intent: 'payment-methods',
    keywords: ['paiement', 'carte', 'cb', 'virement', 'moyen'],
    answer:
      "Nous acceptons les cartes Visa, Mastercard et American Express via Stripe. Pour les marchés publics, contactez-nous pour un paiement par virement.",
  },
  {
    intent: 'shipping-delay',
    keywords: ['délai', 'délais', 'expédition', 'expedier', 'arriver', 'recevoir'],
    answer:
      'Les commandes sont expédiées sous 24 à 48 heures ouvrées. Le délai de livraison est généralement de 2 à 3 jours en France métropolitaine.',
  },
  {
    intent: 'return-policy',
    keywords: ['retour', 'rembourser', 'remboursement', 'sav'],
    answer:
      "Vous disposez de 14 jours pour retourner un produit non utilisé. Le SAV intervient sous 48h pour tout matériel défectueux. Contactez-nous via le formulaire « Contact » pour ouvrir un dossier.",
  },
  {
    intent: 'invoice',
    keywords: ['facture', 'facturation', 'devis'],
    answer:
      'Vos factures sont disponibles dans votre espace client, onglet « Mes commandes ». Pour un devis personnalisé, indiquez les références et quantités souhaitées.',
  },
  {
    intent: 'account',
    keywords: ['compte', 'mot de passe', 'connexion', 'login', 'inscription'],
    answer:
      "Vous pouvez créer un compte ou vous connecter en haut à droite. En cas d'oubli de mot de passe, utilisez le lien « Mot de passe oublié » sur la page de connexion.",
  },
]

const ESCALATION_KEYWORDS = ['humain', 'agent', 'opérateur', 'operateur', 'conseiller', 'parler à quelqu', 'support']

const FALLBACK_ANSWER =
  "Je n'ai pas de réponse précise à cette question. Vous pouvez préciser votre demande ou cliquer sur « Parler à un conseiller » pour un suivi par notre équipe."

export interface BrainReply {
  intent: string
  content: string
  shouldEscalate: boolean
  suggestions?: string[]
}

export function reply(message: string): BrainReply {
  const normalized = normalize(message)

  if (ESCALATION_KEYWORDS.some((kw) => normalized.includes(normalize(kw)))) {
    return {
      intent: 'escalate',
      content:
        'Je transmets votre demande à un conseiller. Indiquez votre adresse email ci-dessous afin que nous puissions vous recontacter.',
      shouldEscalate: true,
    }
  }

  for (const entry of FAQ) {
    if (entry.keywords.some((kw) => normalized.includes(normalize(kw)))) {
      return {
        intent: entry.intent,
        content: entry.answer,
        shouldEscalate: false,
        suggestions: entry.suggestions,
      }
    }
  }

  return {
    intent: 'fallback',
    content: FALLBACK_ANSWER,
    shouldEscalate: false,
  }
}

export function welcomeMessage(): string {
  return [
    "Bonjour, je suis l'assistant Althea. Je peux répondre instantanément aux questions courantes :",
    '• Modifier une adresse',
    '• Moyens de paiement acceptés',
    '• Délais de livraison',
    '• Retours et SAV',
    '',
    'Si besoin, demandez-moi de transférer la conversation à un conseiller.',
  ].join('\n')
}

export const FAQ_SHORTCUTS = FAQ.map((entry) => ({ intent: entry.intent, label: entry.keywords[0]! }))

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
