import path from 'node:path'
import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import PDFDocument from 'pdfkit'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import type Order from '#models/order'

const INVOICE_DIR = 'storage/invoices'

/**
 * Génère une facture professionnelle complète pour Althea Systems
 * Conforme aux obligations légales françaises
 */
export async function generateInvoicePdf(order: Order, invoiceNumber: string): Promise<string> {
  const dir = app.makePath(INVOICE_DIR)
  await fs.mkdir(dir, { recursive: true })
  const filePath = path.join(dir, `${invoiceNumber}.pdf`)

  await order.load('items')
  await order.load('user')
  await order.load('billingAddress')

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = createWriteStream(filePath)
    stream.on('finish', resolve)
    stream.on('error', reject)
    doc.pipe(stream)

    const primaryColor = '#0f172a'
    const secondaryColor = '#475569'
    const accentColor = '#3b82f6'
    const lineColor = '#e2e8f0'

    // ============================================
    // EN-TÊTE ENTREPRISE
    // ============================================

    // Nom de l'entreprise
    doc.fontSize(24).fillColor(accentColor).text('ALTHEA SYSTEMS', 50, 50)
    doc.fontSize(10).fillColor(secondaryColor).text('Matériel médical de pointe', 50, 80)

    // Coordonnées entreprise (colonne de droite)
    doc.fontSize(9).fillColor(secondaryColor)
    const rightColumn = 400
    let y = 50

    // Adresse par défaut (peut être personnalisée via env)
    const companyAddress = env.get('COMPANY_ADDRESS') || '15 Avenue des Sciences'
    const companyCity = env.get('COMPANY_CITY') || '75012 Paris'
    const companyCountry = env.get('COMPANY_COUNTRY') || 'France'

    doc.text(companyAddress, rightColumn, y, { align: 'right' })
    doc.text(companyCity, rightColumn, y + 12, { align: 'right' })
    doc.text(companyCountry, rightColumn, y + 24, { align: 'right' })

    // Contact
    if (env.get('COMPANY_PHONE')) {
      doc.text(`Tél : ${env.get('COMPANY_PHONE')}`, rightColumn, y + 42, { align: 'right' })
    }
    if (env.get('COMPANY_EMAIL')) {
      doc.text(`Email : ${env.get('COMPANY_EMAIL')}`, rightColumn, y + 54, { align: 'right' })
    }

    // Informations légales
    y = 120
    doc.fontSize(8).fillColor('#64748b')
    if (env.get('COMPANY_SIRET')) {
      doc.text(`SIRET : ${env.get('COMPANY_SIRET')}`, rightColumn, y, { align: 'right' })
      y += 12
    }
    if (env.get('COMPANY_VAT')) {
      doc.text(`TVA : ${env.get('COMPANY_VAT')}`, rightColumn, y, { align: 'right' })
      y += 12
    }

    // Ligne de séparation
    doc.moveTo(50, 160).lineTo(545, 160).strokeColor(lineColor).lineWidth(1).stroke()

    // ============================================
    // INFORMATIONS FACTURE
    // ============================================

    y = 180
    doc.fontSize(18).fillColor(primaryColor).text(`FACTURE N° ${invoiceNumber}`, 50, y)

    y = 210
    doc.fontSize(10).fillColor(secondaryColor)
    doc.text(`Date d'émission : ${order.placedAt.toFormat('dd/MM/yyyy')}`, 50, y)

    // Date d'échéance (30 jours par défaut)
    const paymentDays = env.get('COMPANY_PAYMENT_DAYS') || 30
    const dueDate = order.placedAt.plus({ days: paymentDays })
    doc.text(`Date d'échéance : ${dueDate.toFormat('dd/MM/yyyy')}`, 50, y + 15)

    // ============================================
    // INFORMATIONS CLIENT (ENCADRÉ)
    // ============================================

    y = 250

    // Encadré client
    doc
      .rect(50, y, 250, order.billingAddress ? 115 : 80)
      .fillAndStroke('#f8fafc', lineColor)

    y += 15
    doc.fontSize(11).fillColor(primaryColor).text('FACTURÉ À', 60, y)

    y += 20
    doc.fontSize(10).fillColor(secondaryColor)
    doc.text(order.user.fullName ?? order.user.email, 60, y, { width: 230 })

    if (order.billingAddress) {
      const a = order.billingAddress
      y += 15
      doc.text(a.street, 60, y, { width: 230 })
      if (a.line2) {
        y += 12
        doc.text(a.line2, 60, y, { width: 230 })
      }
      y += 12
      doc.text(`${a.postalCode} ${a.city}`, 60, y, { width: 230 })
      y += 12
      doc.text(a.country, 60, y, { width: 230 })
    }

    // ============================================
    // TABLEAU DES PRODUITS
    // ============================================

    y = 385

    // En-tête du tableau
    doc.fontSize(10).fillColor('#ffffff')
    doc.rect(50, y, 495, 25).fill(accentColor)

    doc.text('DÉSIGNATION', 60, y + 8, { width: 220 })
    doc.text('QTÉ', 290, y + 8, { width: 40, align: 'center' })
    doc.text('PRIX UNIT.', 340, y + 8, { width: 70, align: 'right' })
    doc.text('TVA', 420, y + 8, { width: 50, align: 'right' })
    doc.text('TOTAL TTC', 480, y + 8, { width: 65, align: 'right' })

    y += 25

    // Lignes de produits
    doc.fontSize(9).fillColor(secondaryColor)

    const taxRate = order.subtotal > 0 ? (order.tax / order.subtotal) * 100 : 20

    for (const item of order.items) {
      // Ligne de séparation
      doc.moveTo(50, y).lineTo(545, y).strokeColor(lineColor).lineWidth(0.5).stroke()

      y += 10

      // Produit
      const productLines = doc.heightOfString(item.productName, { width: 220 })
      doc.text(item.productName, 60, y, { width: 220 })

      // Quantité
      doc.text(String(item.quantity), 290, y, { width: 40, align: 'center' })

      // Prix unitaire
      doc.text(formatPrice(item.unitPrice), 340, y, { width: 70, align: 'right' })

      // TVA
      doc.text(`${taxRate.toFixed(0)}%`, 420, y, { width: 50, align: 'right' })

      // Total
      doc.text(formatPrice(item.total), 480, y, { width: 65, align: 'right' })

      y += Math.max(productLines, 12) + 8
    }

    // Ligne finale du tableau
    doc.moveTo(50, y).lineTo(545, y).strokeColor(lineColor).lineWidth(0.5).stroke()

    // ============================================
    // RÉCAPITULATIF FINANCIER
    // ============================================

    y += 20
    doc.fontSize(10).fillColor(secondaryColor)

    const labelX = 380
    const valueX = 480

    // Sous-total HT
    const subtotalHT = order.subtotal / (1 + taxRate / 100)
    drawSummaryLine(doc, 'Sous-total HT', subtotalHT, labelX, valueX, y)
    y += 18

    // Frais de port
    if (order.shippingCost > 0) {
      const shippingHT = order.shippingCost / (1 + taxRate / 100)
      drawSummaryLine(doc, 'Frais de port', shippingHT, labelX, valueX, y)
      y += 18
    }

    // TVA
    drawSummaryLine(doc, `TVA (${taxRate.toFixed(1)}%)`, order.tax, labelX, valueX, y)
    y += 25

    // Total TTC (encadré)
    doc
      .rect(labelX - 10, y - 5, 175, 30)
      .fillAndStroke('#f0f9ff', accentColor)

    doc.fontSize(12).fillColor(primaryColor).font('Helvetica-Bold')
    doc.text('TOTAL TTC', labelX, y + 5, { width: 90 })
    doc.text(formatPrice(order.total), valueX, y + 5, { width: 65, align: 'right' })

    doc.font('Helvetica') // Reset font

    // ============================================
    // PIED DE PAGE
    // ============================================

    y = 700

    // Ligne de séparation
    doc.moveTo(50, y).lineTo(545, y).strokeColor(lineColor).lineWidth(1).stroke()

    y += 15
    doc.fontSize(8).fillColor(secondaryColor)

    // Conditions de paiement
    doc.text('CONDITIONS DE PAIEMENT', 50, y)
    y += 12
    doc.fontSize(7).fillColor('#64748b')
    doc.text(
      `Paiement à réception par carte bancaire. Échéance : ${paymentDays} jours.`,
      50,
      y,
      { width: 495 }
    )

    // Coordonnées bancaires (si disponibles)
    if (env.get('COMPANY_BANK_IBAN')) {
      y += 15
      doc.fontSize(8).fillColor(secondaryColor)
      doc.text('COORDONNÉES BANCAIRES', 50, y)
      y += 12
      doc.fontSize(7).fillColor('#64748b')
      doc.text(`IBAN : ${env.get('COMPANY_BANK_IBAN')}`, 50, y)
      if (env.get('COMPANY_BANK_BIC')) {
        y += 10
        doc.text(`BIC : ${env.get('COMPANY_BANK_BIC')}`, 50, y)
      }
    }

    // Message de remerciement
    doc.fontSize(9).fillColor(accentColor)
    doc.text(
      'Merci pour votre confiance !',
      50,
      785,
      { width: 495, align: 'center' }
    )

    doc.end()
  })

  return filePath
}

function drawSummaryLine(
  doc: PDFKit.PDFDocument,
  label: string,
  value: number,
  labelX: number,
  valueX: number,
  y: number
) {
  doc.text(label, labelX, y, { width: 90 })
  doc.text(formatPrice(value), valueX, y, { width: 65, align: 'right' })
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    Number(value)
  )
}
