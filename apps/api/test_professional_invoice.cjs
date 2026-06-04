/**
 * Test de la nouvelle facture professionnelle Althea Systems
 * Lance: node test_professional_invoice.cjs
 */

const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path')

console.log('🧪 Test: Génération de la facture professionnelle Althea Systems\n')

// Données de test
const mockOrder = {
  id: 123,
  placedAt: new Date('2026-06-04'),
  subtotal: 100.0,
  tax: 20.0,
  shippingCost: 10.0,
  total: 130.0,
  user: {
    fullName: 'Dr. Marie Dubois',
    email: 'marie.dubois@hopital.fr',
  },
  billingAddress: {
    street: '45 Rue de la Santé',
    line2: 'Service Cardiologie',
    city: 'Lyon',
    postalCode: '69003',
    country: 'France',
  },
  items: [
    {
      productName: 'Stéthoscope Électronique Premium',
      quantity: 1,
      unitPrice: 85.0,
      total: 85.0,
    },
    {
      productName: 'Tensiomètre Digital Automatique',
      quantity: 1,
      unitPrice: 15.0,
      total: 15.0,
    },
  ],
}

const invoiceNumber = 'ALT-20260604-00123'
const dir = path.join(__dirname, 'storage', 'invoices')

// Créer le dossier
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

const filePath = path.join(dir, `${invoiceNumber}.pdf`)

// Variables d'environnement simulées
const env = {
  COMPANY_ADDRESS: '15 Avenue des Sciences',
  COMPANY_CITY: '75012 Paris',
  COMPANY_COUNTRY: 'France',
  COMPANY_PHONE: '+33 1 23 45 67 89',
  COMPANY_EMAIL: 'contact@althea-systems.fr',
  COMPANY_SIRET: '123 456 789 00012',
  COMPANY_VAT: 'FR12345678901',
  COMPANY_PAYMENT_DAYS: 30,
  COMPANY_BANK_IBAN: 'FR76 1234 5678 9012 3456 7890 123',
  COMPANY_BANK_BIC: 'BNPAFRPPXXX',
}

// Générer la facture
const doc = new PDFDocument({ size: 'A4', margin: 50 })
const stream = fs.createWriteStream(filePath)

stream.on('finish', () => {
  const stats = fs.statSync(filePath)
  console.log('✅ Facture générée avec succès !')
  console.log(`📄 Fichier: ${filePath}`)
  console.log(`📊 Taille: ${(stats.size / 1024).toFixed(2)} KB`)
  console.log('\n📝 Contenu de la facture:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('• En-tête entreprise avec logo et coordonnées')
  console.log('• Informations légales (SIRET, TVA)')
  console.log('• Numéro de facture et dates')
  console.log('• Encadré client avec adresse complète')
  console.log('• Tableau des produits (désignation, qté, prix, TVA)')
  console.log('• Récapitulatif financier (HT, TVA, TTC)')
  console.log('• Conditions de paiement')
  console.log('• Coordonnées bancaires (RIB)')
  console.log('• Message de remerciement')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n✨ Ouvrez le PDF pour voir le résultat !')
})

stream.on('error', (err) => {
  console.error('❌ Erreur:', err)
})

doc.pipe(stream)

const primaryColor = '#0f172a'
const secondaryColor = '#475569'
const accentColor = '#3b82f6'
const lineColor = '#e2e8f0'

// EN-TÊTE
doc.fontSize(24).fillColor(accentColor).text('ALTHEA SYSTEMS', 50, 50)
doc.fontSize(10).fillColor(secondaryColor).text('Matériel médical de pointe', 50, 80)

// Coordonnées entreprise
const rightColumn = 400
let y = 50
doc.fontSize(9).fillColor(secondaryColor)
doc.text(env.COMPANY_ADDRESS, rightColumn, y, { align: 'right' })
doc.text(env.COMPANY_CITY, rightColumn, y + 12, { align: 'right' })
doc.text(env.COMPANY_COUNTRY, rightColumn, y + 24, { align: 'right' })
doc.text(`Tél : ${env.COMPANY_PHONE}`, rightColumn, y + 42, { align: 'right' })
doc.text(`Email : ${env.COMPANY_EMAIL}`, rightColumn, y + 54, { align: 'right' })

// Informations légales
y = 120
doc.fontSize(8).fillColor('#64748b')
doc.text(`SIRET : ${env.COMPANY_SIRET}`, rightColumn, y, { align: 'right' })
doc.text(`TVA : ${env.COMPANY_VAT}`, rightColumn, y + 12, { align: 'right' })

// Ligne de séparation
doc.moveTo(50, 160).lineTo(545, 160).strokeColor(lineColor).lineWidth(1).stroke()

// INFORMATIONS FACTURE
y = 180
doc.fontSize(18).fillColor(primaryColor).text(`FACTURE N° ${invoiceNumber}`, 50, y)

y = 210
doc.fontSize(10).fillColor(secondaryColor)
const date = new Date(mockOrder.placedAt)
doc.text(`Date d'émission : ${date.toLocaleDateString('fr-FR')}`, 50, y)

const dueDate = new Date(date)
dueDate.setDate(dueDate.getDate() + env.COMPANY_PAYMENT_DAYS)
doc.text(`Date d'échéance : ${dueDate.toLocaleDateString('fr-FR')}`, 50, y + 15)

// CLIENT (ENCADRÉ)
y = 250
doc.rect(50, y, 250, 115).fillAndStroke('#f8fafc', lineColor)

y += 15
doc.fontSize(11).fillColor(primaryColor).text('FACTURÉ À', 60, y)

y += 20
doc.fontSize(10).fillColor(secondaryColor)
doc.text(mockOrder.user.fullName, 60, y, { width: 230 })
y += 15
doc.text(mockOrder.billingAddress.street, 60, y, { width: 230 })
y += 12
doc.text(mockOrder.billingAddress.line2, 60, y, { width: 230 })
y += 12
doc.text(
  `${mockOrder.billingAddress.postalCode} ${mockOrder.billingAddress.city}`,
  60,
  y,
  { width: 230 }
)
y += 12
doc.text(mockOrder.billingAddress.country, 60, y, { width: 230 })

// TABLEAU DES PRODUITS
y = 385

// En-tête
doc.fontSize(10).fillColor('#ffffff')
doc.rect(50, y, 495, 25).fill(accentColor)
doc.text('DÉSIGNATION', 60, y + 8, { width: 220 })
doc.text('QTÉ', 290, y + 8, { width: 40, align: 'center' })
doc.text('PRIX UNIT.', 340, y + 8, { width: 70, align: 'right' })
doc.text('TVA', 420, y + 8, { width: 50, align: 'right' })
doc.text('TOTAL TTC', 480, y + 8, { width: 65, align: 'right' })

y += 25

// Produits
doc.fontSize(9).fillColor(secondaryColor)
const taxRate = (mockOrder.tax / mockOrder.subtotal) * 100

for (const item of mockOrder.items) {
  doc.moveTo(50, y).lineTo(545, y).strokeColor(lineColor).lineWidth(0.5).stroke()
  y += 10

  doc.text(item.productName, 60, y, { width: 220 })
  doc.text(String(item.quantity), 290, y, { width: 40, align: 'center' })
  doc.text(formatPrice(item.unitPrice), 340, y, { width: 70, align: 'right' })
  doc.text(`${taxRate.toFixed(0)}%`, 420, y, { width: 50, align: 'right' })
  doc.text(formatPrice(item.total), 480, y, { width: 65, align: 'right' })

  y += 20
}

doc.moveTo(50, y).lineTo(545, y).strokeColor(lineColor).lineWidth(0.5).stroke()

// RÉCAPITULATIF
y += 20
doc.fontSize(10).fillColor(secondaryColor)
const labelX = 380
const valueX = 480

const subtotalHT = mockOrder.subtotal / (1 + taxRate / 100)
doc.text('Sous-total HT', labelX, y)
doc.text(formatPrice(subtotalHT), valueX, y, { width: 65, align: 'right' })
y += 18

const shippingHT = mockOrder.shippingCost / (1 + taxRate / 100)
doc.text('Frais de port', labelX, y)
doc.text(formatPrice(shippingHT), valueX, y, { width: 65, align: 'right' })
y += 18

doc.text(`TVA (${taxRate.toFixed(1)}%)`, labelX, y)
doc.text(formatPrice(mockOrder.tax), valueX, y, { width: 65, align: 'right' })
y += 25

// TOTAL (encadré)
doc.rect(labelX - 10, y - 5, 175, 30).fillAndStroke('#f0f9ff', accentColor)
doc.fontSize(12).fillColor(primaryColor).font('Helvetica-Bold')
doc.text('TOTAL TTC', labelX, y + 5)
doc.text(formatPrice(mockOrder.total), valueX, y + 5, { width: 65, align: 'right' })
doc.font('Helvetica')

// PIED DE PAGE
y = 700
doc.moveTo(50, y).lineTo(545, y).strokeColor(lineColor).lineWidth(1).stroke()

y += 15
doc.fontSize(8).fillColor(secondaryColor)
doc.text('CONDITIONS DE PAIEMENT', 50, y)
y += 12
doc.fontSize(7).fillColor('#64748b')
doc.text(
  `Paiement à réception par carte bancaire. Échéance : ${env.COMPANY_PAYMENT_DAYS} jours.`,
  50,
  y,
  { width: 495 }
)

y += 15
doc.fontSize(8).fillColor(secondaryColor)
doc.text('COORDONNÉES BANCAIRES', 50, y)
y += 12
doc.fontSize(7).fillColor('#64748b')
doc.text(`IBAN : ${env.COMPANY_BANK_IBAN}`, 50, y)
y += 10
doc.text(`BIC : ${env.COMPANY_BANK_BIC}`, 50, y)

// Message
doc.fontSize(9).fillColor(accentColor)
doc.text('Merci pour votre confiance !', 50, 785, { width: 495, align: 'center' })

doc.end()

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value))
}
