# Facture Professionnelle Althea Systems

**Date**: 4 juin 2026
**Statut**: ✅ **Terminé et testé**

---

## Vue d'ensemble

Une **seule facture professionnelle** est maintenant utilisée à la fois par les **clients** et les **administrateurs**.

Cette facture est:
- 📄 **Professionnelle** - Ressemble à une vraie facture d'entreprise
- 🎨 **Élégante** - Design moderne avec couleurs et sections claires
- ✅ **Complète** - Toutes les informations légales et comptables
- 🔍 **Simple** - Facile à comprendre pour tout le monde

---

## Ce que contient la facture

### 🏢 En-tête entreprise
```
┌─────────────────────────────────────────────┐
│ ALTHEA SYSTEMS                    15 Av. des Sciences │
│ Matériel médical de pointe       75012 Paris          │
│                                    France               │
│                                    Tél: +33 1 23...    │
│                                    Email: contact@...  │
│                                                        │
│                                    SIRET: 123 456...   │
│                                    TVA: FR123...       │
└─────────────────────────────────────────────┘
```

### 📋 Informations facture
- **Numéro de facture**: ALT-20260604-00123 (bien visible)
- **Date d'émission**: 04/06/2026
- **Date d'échéance**: 04/07/2026 (30 jours)

### 👤 Encadré client
```
┌───────────────────────┐
│ FACTURÉ À            │
│                       │
│ Dr. Marie Dubois      │
│ 45 Rue de la Santé    │
│ Service Cardiologie   │
│ 69003 Lyon            │
│ France                │
└───────────────────────┘
```

### 📦 Tableau des produits
```
┌────────────────────────────────────────────────────────────────────┐
│ DÉSIGNATION              │ QTÉ │ PRIX UNIT. │ TVA  │ TOTAL TTC   │
├────────────────────────────────────────────────────────────────────┤
│ Stéthoscope Premium      │  1  │   85,00 €  │ 20%  │   85,00 €   │
│ Tensiomètre Digital      │  1  │   15,00 €  │ 20%  │   15,00 €   │
└────────────────────────────────────────────────────────────────────┘
```

### 💰 Récapitulatif financier
```
                               Sous-total HT     83,33 €
                               Frais de port      8,33 €
                               TVA (20,0%)       20,00 €
                               ┌─────────────────────────┐
                               │ TOTAL TTC    130,00 €   │
                               └─────────────────────────┘
```

### 📜 Pied de page
- **Conditions de paiement**: Paiement à réception, échéance 30 jours
- **Coordonnées bancaires**: IBAN et BIC
- **Message**: "Merci pour votre confiance !"

---

## Configuration requise

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Adresse de l'entreprise
COMPANY_ADDRESS=15 Avenue des Sciences
COMPANY_CITY=75012 Paris
COMPANY_COUNTRY=France

# Contact
COMPANY_PHONE=+33 1 23 45 67 89
COMPANY_EMAIL=contact@althea-systems.fr

# Informations légales
COMPANY_SIRET=123 456 789 00012
COMPANY_VAT=FR12345678901

# Paiement
COMPANY_PAYMENT_DAYS=30

# Coordonnées bancaires
COMPANY_BANK_IBAN=FR76 1234 5678 9012 3456 7890 123
COMPANY_BANK_BIC=BNPAFRPPXXX
```

### Valeurs par défaut

Si vous ne configurez pas les variables, des valeurs par défaut sont utilisées:
- Adresse: `15 Avenue des Sciences, 75012 Paris, France`
- Échéance de paiement: `30 jours`

---

## Comment ça marche

### Pour les clients

Quand un client télécharge sa facture:

```bash
GET /account/orders/:id/invoice
```

Il obtient **la même facture professionnelle** que l'admin.

### Pour les administrateurs

Quand un admin télécharge une facture:

```bash
GET /admin/invoices/:id/download
```

Il obtient **la même facture professionnelle** que le client.

### Génération automatique

La facture est **automatiquement générée** lors de la création d'une commande:

1. Client passe commande
2. Paiement validé
3. **Facture PDF créée automatiquement** dans `storage/invoices/`
4. Email envoyé au client avec la facture

---

## Test de la facture

Un script de test est fourni pour visualiser la facture:

```bash
cd apps/api
node test_professional_invoice.cjs
```

Cela génère une facture d'exemple dans `storage/invoices/ALT-20260604-00123.pdf`.

**Ouvrez le PDF** pour voir à quoi ressemble la facture !

---

## Avantages de cette approche

### ✅ Simplicité
- **Un seul générateur** au lieu de deux
- Moins de code à maintenir
- Pas de risque de divergence

### ✅ Clarté
- Facture facile à lire pour **tout le monde**
- Prix en **TTC** pour les clients
- Détail **HT/TVA** pour la comptabilité

### ✅ Professionnalisme
- Design moderne et élégant
- Toutes les mentions légales
- Ressemble à une vraie facture

### ✅ Flexibilité
- Personnalisable via variables d'environnement
- Adapté aux besoins français
- Conforme aux obligations légales

---

## Exemple de facture complète

Voici ce que voit un client/admin quand il télécharge une facture:

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║  ALTHEA SYSTEMS                          15 Avenue des Sciences ║
║  Matériel médical de pointe             75012 Paris             ║
║                                          France                  ║
║                                          Tél: +33 1 23 45 67 89  ║
║                                          Email: contact@...      ║
║                                                                  ║
║                                          SIRET: 123 456 789...   ║
║                                          TVA: FR12345678901      ║
║──────────────────────────────────────────────────────────────────║
║                                                                  ║
║  FACTURE N° ALT-20260604-00123                                  ║
║                                                                  ║
║  Date d'émission : 04/06/2026                                   ║
║  Date d'échéance : 04/07/2026                                   ║
║                                                                  ║
║  ┌────────────────────────┐                                     ║
║  │ FACTURÉ À             │                                      ║
║  │                        │                                      ║
║  │ Dr. Marie Dubois       │                                      ║
║  │ 45 Rue de la Santé     │                                      ║
║  │ Service Cardiologie    │                                      ║
║  │ 69003 Lyon             │                                      ║
║  │ France                 │                                      ║
║  └────────────────────────┘                                     ║
║                                                                  ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │ DÉSIGNATION       │ QTÉ │ PRIX UNIT. │ TVA │ TOTAL TTC │   ║
║  ├──────────────────────────────────────────────────────────┤   ║
║  │ Stéthoscope...    │  1  │   85,00 €  │ 20% │  85,00 € │   ║
║  │ Tensiomètre...    │  1  │   15,00 €  │ 20% │  15,00 € │   ║
║  └──────────────────────────────────────────────────────────┘   ║
║                                                                  ║
║                                    Sous-total HT    83,33 €     ║
║                                    Frais de port     8,33 €     ║
║                                    TVA (20,0%)      20,00 €     ║
║                                    ╔═══════════════════════╗    ║
║                                    ║ TOTAL TTC   130,00 € ║    ║
║                                    ╚═══════════════════════╝    ║
║──────────────────────────────────────────────────────────────────║
║                                                                  ║
║  CONDITIONS DE PAIEMENT                                         ║
║  Paiement à réception par carte bancaire. Échéance : 30 jours. ║
║                                                                  ║
║  COORDONNÉES BANCAIRES                                          ║
║  IBAN : FR76 1234 5678 9012 3456 7890 123                      ║
║  BIC : BNPAFRPPXXX                                              ║
║                                                                  ║
║                 Merci pour votre confiance !                    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Système d'avoirs (Phase 2)

La **génération automatique d'avoirs** est **conservée** et fonctionne parfaitement:

### ✅ Annulation de commande par le client
```
POST /account/orders/:id/cancel
→ Avoir créé automatiquement
→ Remboursement Stripe automatique
```

### ✅ Remboursement Stripe (webhook)
```
Stripe Dashboard → Remboursement
→ Webhook déclenché
→ Avoir créé automatiquement
```

Les avoirs continuent de fonctionner exactement comme avant !

---

## Points clés à retenir

1. **Une seule facture** pour client et admin
2. **Design professionnel** et moderne
3. **Toutes les infos** nécessaires (légales, comptables, contact)
4. **Simple à comprendre** pour tout le monde
5. **Personnalisable** via variables d'environnement
6. **Génération automatique** lors de chaque commande
7. **Phase 2 intacte** (avoirs automatiques)

---

## Prochaines étapes

### Pour tester
```bash
cd apps/api
node test_professional_invoice.cjs
# Ouvrir storage/invoices/ALT-20260604-00123.pdf
```

### Pour déployer
1. Copier les variables d'environnement dans `.env`
2. Personnaliser avec vos vraies informations (SIRET, adresse, etc.)
3. Créer une vraie commande pour tester
4. Vérifier la facture générée

### Pour personnaliser
Modifiez les couleurs dans `invoice_generator.ts`:
```typescript
const primaryColor = '#0f172a'  // Couleur principale (texte)
const accentColor = '#3b82f6'   // Couleur accent (en-têtes, encadrés)
const lineColor = '#e2e8f0'     // Couleur des lignes
```

---

## Support

Si vous voulez modifier le design ou ajouter des informations:
- Le générateur est dans `apps/api/app/services/invoice_generator.ts`
- Les coordonnées sont configurables via `.env`
- Le test permet de voir les changements immédiatement

**La facture est prête à être utilisée en production !** 🚀
