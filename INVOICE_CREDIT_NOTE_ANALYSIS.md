# Analyse: Factures Client/Admin et Avoirs

## Découvertes Critiques

### 🔴 Problème 1: UN SEUL type de facture pour Client ET Admin

**Situation Actuelle**:
- ✅ Il existe UN SEUL générateur: `invoice_generator.ts`
- ✅ Le même PDF est utilisé pour:
  - Client: `GET /orders/:id/invoice`
  - Admin: `GET /admin/invoices/:id/download`

**Ce qui DEVRAIT exister** (selon les pratiques comptables):

#### Facture Client (B2C)
- Informations simplifiées
- Orientée lisibilité
- Pas de détails comptables
- TVA incluse dans le prix

#### Facture Administrative/Comptable (pour l'admin)
- Numéro SIRET/SIREN
- Conditions de paiement
- Pénalités de retard
- Escompte éventuel
- Détails TVA par taux
- Mentions légales complètes
- Coordonnées bancaires (RIB)

---

### 🔴 Problème 2: Avoirs ne se génèrent PAS automatiquement

**Situation Actuelle**:

Les avoirs (credit notes) sont créés **MANUELLEMENT** par l'admin via:

```typescript
// admin_invoices_controller.ts:94-122
POST /admin/credit-notes
Body: {
  invoiceId: 123,
  amount: 50.00,
  reason: "Produit défectueux"
}
```

**Processus Manuel**:
1. Admin doit identifier la facture
2. Admin doit calculer le montant à rembourser
3. Admin crée manuellement l'avoir
4. L'avoir génère un PDF via `credit_note_generator.ts`

**Ce qui DEVRAIT être automatique**:
- ✅ Avoir pour remboursement complet
- ✅ Avoir pour retour de produit
- ✅ Avoir pour annulation de commande
- ❌ Avoir pour remboursement partiel (reste manuel - OK)

---

## Analyse Détaillée

### Générateur de Facture Actuel

**Fichier**: `invoice_generator.ts`

**Contenu du PDF généré**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Althea Systems
Matériel médical de pointe

Facture ALT-20260604-00123
Date : 04/06/2026

Facturé à
[Nom du client]
[Adresse ligne 1]
[Adresse ligne 2]
[Code postal] [Ville]
[Pays]

Produit              Qté    PU        Total
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Produit 1]           2    50,00 €   100,00 €
[Produit 2]           1    30,00 €    30,00 €

                    Sous-total   130,00 €
                    Livraison     10,00 €
                    TVA           28,00 €
                    Total        168,00 €
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Informations MANQUANTES pour une facture légale complète**:
- ❌ SIRET/SIREN de l'entreprise
- ❌ N° TVA intracommunautaire
- ❌ Capital social
- ❌ Conditions de paiement
- ❌ Pénalités de retard (texte légal)
- ❌ Indemnité forfaitaire de recouvrement
- ❌ Escompte pour paiement anticipé
- ❌ Détail TVA (si plusieurs taux)
- ❌ RIB/Coordonnées bancaires
- ❌ "TVA non applicable, art. 293 B du CGI" (si micro-entreprise)

---

### Générateur d'Avoir Actuel

**Fichier**: `credit_note_generator.ts`

**Contenu du PDF généré**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Althea Systems
Matériel médical de pointe

Avoir AVO-20260604-00001
Date : 04/06/2026
Facture liée : ALT-20260604-00123

Émis pour
[Nom du client]

Motif
[Raison du remboursement]

Montant : 50,00 €
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Informations MANQUANTES**:
- ❌ Détails des produits remboursés
- ❌ Détail TVA remboursée
- ❌ Méthode de remboursement prévue
- ❌ Lien avec le remboursement Stripe
- ❌ Délai de traitement
- ❌ Mentions légales

---

## Système Actuel vs Système Idéal

### Factures

| Fonctionnalité | Actuel | Recommandé |
|----------------|--------|------------|
| **Nombre de types** | 1 seul PDF | 2 PDFs distincts |
| **Facture Client** | ✅ Basique | 🟡 Améliorer lisibilité |
| **Facture Admin** | ❌ Même que client | ⚠️ Ajouter infos légales |
| **Mentions légales** | ❌ Manquantes | ✅ Obligatoires |
| **SIRET** | ❌ Absent | ✅ Obligatoire |
| **TVA détaillée** | 🟡 Total seulement | ✅ Par taux si multiple |
| **Conditions paiement** | ❌ Absentes | ✅ Obligatoires B2B |

### Avoirs

| Fonctionnalité | Actuel | Recommandé |
|----------------|--------|------------|
| **Génération** | ❌ Manuelle uniquement | 🟡 Semi-automatique |
| **Annulation commande** | ❌ Manuel | ✅ Auto si < 24h |
| **Remboursement complet** | ❌ Manuel | ✅ Auto avec raison |
| **Remboursement partiel** | ✅ Manuel (OK) | ✅ Manuel (OK) |
| **Lien avec Stripe** | ❌ Aucun | ⚠️ Webhook refund |
| **Détail produits** | ❌ Absent | ✅ Nécessaire |

---

## Bugs et Problèmes Identifiés

### 🔴 Bug 1: Factures non conformes légalement (France)

**Gravité**: CRITIQUE pour B2B

**Problème**: Les factures ne contiennent pas les mentions légales obligatoires

**Article L441-9 du Code de commerce** exige:
1. Nom et adresse des parties
2. Date d'émission
3. **Numéro d'ordre** ✅
4. **Date de vente ou prestation** ✅
5. Quantité et dénomination précise ✅
6. Prix unitaire HT ✅
7. **Taux de TVA et montant** ✅
8. **Réductions de prix** (si applicable)
9. **Date limite de paiement** ❌
10. **Conditions d'escompte** ❌
11. **Pénalités de retard** ❌ (si B2B)
12. **Indemnité forfaitaire recouvrement (40€)** ❌ (si B2B)
13. **SIRET, capital social** ❌

**Impact**:
- Facturation B2B non conforme
- Risque d'amende jusqu'à 75 000 € (personne physique)
- Factures contestables juridiquement

**Solution**: Créer deux générateurs distincts

---

### 🔴 Bug 2: Avoirs sans lien avec Stripe refunds

**Gravité**: HAUTE - Incohérence comptable

**Problème**: Admin crée avoir manuellement, mais pas de remboursement Stripe automatique

**Flux actuel (CASSÉ)**:
```
1. Client demande remboursement
2. Admin crée avoir manuellement
3. ❌ Admin doit AUSSI rembourser dans Stripe séparément
4. Risque: Avoir créé mais pas de remboursement réel
5. Ou: Remboursement Stripe sans avoir
```

**Flux idéal**:
```
1. Client demande remboursement
2. Admin crée avoir → API crée AUTOMATIQUEMENT remboursement Stripe
3. OU: Webhook Stripe refund → API crée AUTOMATIQUEMENT avoir
4. Synchronisation garantie
```

---

### 🟡 Bug 3: Avoirs incomplets

**Gravité**: MOYENNE

**Problème**: Avoir n'indique pas:
- Quels produits sont remboursés
- Quelle TVA est remboursée
- Comment le client sera remboursé (carte bancaire, virement, etc.)

**Code actuel** (`credit_note_generator.ts:40-47`):
```typescript
if (creditNote.reason) {
  doc.text(creditNote.reason)  // Texte libre seulement
}
doc.text(`Montant : ${formatPrice(creditNote.amount)}`)
// ❌ Pas de détail des produits
// ❌ Pas de détail TVA
```

---

### 🟡 Bug 4: Date incorrecte dans l'avoir

**Gravité**: FAIBLE

**Problème**: Utilise `new Date()` au lieu de `creditNote.issuedAt`

**Code** (`credit_note_generator.ts:32`):
```typescript
doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`)
// ❌ Devrait être:
doc.text(`Date : ${creditNote.issuedAt.toFormat('dd/MM/yyyy')}`)
```

---

## Solutions Recommandées

### Solution 1: Créer deux générateurs de factures

**Structure proposée**:
```
services/
├── invoice_generator.ts              (facture client - simple)
├── invoice_admin_generator.ts        (facture comptable - complète)
├── credit_note_generator.ts          (avoir existant)
└── credit_note_detailed_generator.ts (avoir détaillé)
```

**Facture Client** (`invoice_generator.ts`):
- Design épuré
- Focus lisibilité
- Informations essentielles
- Idéal pour email/impression client

**Facture Admin** (`invoice_admin_generator.ts`):
- Toutes mentions légales
- Détails comptables
- Conforme Code de commerce
- Archivage comptable

---

### Solution 2: Automatiser génération d'avoirs

**Cas d'usage automatiques**:

#### 2.1 Commande annulée par client
```typescript
// Dans OrdersController
async cancelOrder({ auth, params }: HttpContext) {
  const order = await Order.findOrFail(params.id)

  // Conditions: commande < 24h, status = 'paid' ou 'processing'
  if (canAutoCancelOrder(order)) {
    // 1. Créer avoir automatiquement
    const creditNote = await createAutoCreditNote(order, 'Annulation client')

    // 2. Remboursement Stripe automatique
    await stripeClient().refunds.create({
      payment_intent: order.stripePaymentIntentId,
      reason: 'requested_by_customer'
    })

    // 3. Changer status
    order.status = 'cancelled'
    await order.save()
  }
}
```

#### 2.2 Webhook Stripe refund
```typescript
// Dans stripe_webhooks_controller.ts
async handleChargeRefunded(charge: Stripe.Charge) {
  const order = await Order.query()
    .where('stripePaymentIntentId', charge.payment_intent)
    .first()

  if (order) {
    // Créer avoir automatiquement
    await createAutoCreditNote(
      order,
      'Remboursement Stripe',
      charge.amount_refunded
    )
  }
}
```

---

### Solution 3: Lier avoirs et remboursements Stripe

**Ajout de champs au modèle CreditNote**:
```typescript
// app/models/credit_note.ts
@column()
declare stripeRefundId: string | null  // ID du refund Stripe

@column()
declare refundStatus: 'pending' | 'completed' | 'failed'

@column()
declare refundMethod: 'stripe' | 'manual' | 'bank_transfer'
```

**Migration**:
```typescript
table.string('stripe_refund_id').nullable()
table.enum('refund_status', ['pending', 'completed', 'failed'])
table.enum('refund_method', ['stripe', 'manual', 'bank_transfer'])
```

---

## Plan d'Action Proposé

### Phase 1: Conformité Légale (URGENT)
1. ✅ Créer `invoice_admin_generator.ts` avec mentions légales complètes
2. ✅ Ajouter variables d'environnement:
   ```env
   COMPANY_SIRET=123 456 789 00012
   COMPANY_VAT=FR12345678901
   COMPANY_CAPITAL=10000
   COMPANY_RCS=Paris B 123 456 789
   ```
3. ✅ Garder `invoice_generator.ts` pour factures clients

### Phase 2: Automatisation Avoirs (HAUTE PRIORITÉ)
1. ✅ Ajouter champs Stripe au modèle CreditNote
2. ✅ Créer fonction `createAutoCreditNote()`
3. ✅ Webhook Stripe: refund → avoir automatique
4. ✅ Endpoint annulation: créer avoir + refund Stripe

### Phase 3: Amélioration Avoirs (MOYENNE PRIORITÉ)
1. ✅ Détail des produits remboursés dans l'avoir
2. ✅ Détail TVA remboursée
3. ✅ Utiliser `creditNote.issuedAt` au lieu de `new Date()`
4. ✅ Indicateur méthode de remboursement

---

## Conclusion

### État Actuel
- ❌ **1 seul type de facture** (devrait en avoir 2)
- ❌ **Avoirs manuels uniquement** (devrait être semi-automatique)
- ❌ **Factures non conformes légalement** (mentions manquantes)
- ❌ **Pas de lien Stripe ↔ Avoirs** (risque d'incohérence)

### Risques Identifiés
1. 🔴 **Légal**: Factures non conformes Code de commerce (risque amende)
2. 🔴 **Comptable**: Avoirs sans remboursement Stripe (ou inverse)
3. 🟡 **Opérationnel**: Double saisie admin (avoir + refund Stripe)
4. 🟡 **Client**: Avoirs peu détaillés (confusion possible)

### Recommandation
**Priorité**: Implémenter Phase 1 (conformité légale) IMMÉDIATEMENT
**Délai**: Phase 2 dans les 2 semaines
**Impact**: Éviter risques juridiques + améliorer expérience admin/client
