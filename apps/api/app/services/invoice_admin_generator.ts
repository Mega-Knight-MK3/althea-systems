import path from 'node:path'
import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import PDFDocument from 'pdfkit'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import type Order from '#models/order'

const INVOICE_DIR = 'storage/invoices'

/**
 * Generates an administrative/accounting invoice with full French legal compliance
 * per Code de commerce Article L441-9.
 * This invoice includes all mandatory legal mentions for B2B transactions.
 */
export async function generateAdminInvoicePdf(
  order: Order,
  invoiceNumber: string
): Promise<string> {
  const dir = app.makePath(INVOICE_DIR)
  await fs.mkdir(dir, { recursive: true })
  const filePath = path.join(dir, `${invoiceNumber}-admin.pdf`)

  await order.load('items')
  await order.load('user')
  await order.load('billingAddress')

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = createWriteStream(filePath)
    stream.on('finish', resolve)
    stream.on('error', reject)
    doc.pipe(stream)

    // Company header with legal information
    doc.fontSize(20).text('Althea Systems', { align: 'left' })
    doc.fontSize(10).fillColor('#475569').text('Matériel médical de pointe')

    // Company legal details (left side)
    doc.fontSize(8).fillColor('#64748b')
    if (env.get('COMPANY_SIRET')) {
      doc.text(`SIRET: ${env.get('COMPANY_SIRET')}`)
    }
    if (env.get('COMPANY_VAT')) {
      doc.text(`TVA: ${env.get('COMPANY_VAT')}`)
    }
    if (env.get('COMPANY_RCS')) {
      doc.text(`${env.get('COMPANY_RCS')}`)
    }
    if (env.get('COMPANY_CAPITAL')) {
      doc.text(`Capital social: ${env.get('COMPANY_CAPITAL')} €`)
    }

    doc.moveDown(2)

    // Invoice information
    doc.fontSize(16).fillColor('#0f172a').text(`Facture ${invoiceNumber}`)
    doc
      .fontSize(10)
      .fillColor('#475569')
      .text(`Date d'émission : ${order.placedAt.toFormat('dd/MM/yyyy')}`)

    // Payment terms
    const paymentDays = env.get('COMPANY_PAYMENT_DAYS', 30)
    const dueDate = order.placedAt.plus({ days: paymentDays })
    doc.text(`Date d'échéance : ${dueDate.toFormat('dd/MM/yyyy')}`)
    doc.moveDown()

    // Billing address
    doc.fontSize(11).fillColor('#0f172a').text('Facturé à')
    doc.fontSize(10).fillColor('#475569').text(order.user.fullName ?? order.user.email)
    if (order.billingAddress) {
      const a = order.billingAddress
      doc.text(a.fullName)
      doc.text(a.street)
      if (a.line2) doc.text(a.line2)
      doc.text(`${a.postalCode} ${a.city}`)
      doc.text(a.country)
    }
    doc.moveDown(2)

    // Items table
    const tableTop = doc.y
    doc.fontSize(10).fillColor('#0f172a')
    doc.text('Produit', 50, tableTop)
    doc.text('Qté', 300, tableTop, { width: 50, align: 'right' })
    doc.text('PU HT', 360, tableTop, { width: 70, align: 'right' })
    doc.text('Total HT', 440, tableTop, { width: 100, align: 'right' })
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#cbd5e1').stroke()

    let cursor = tableTop + 25
    doc.fillColor('#475569')

    // Calculate tax rate from order
    const taxRate = order.subtotal > 0 ? (order.tax / order.subtotal) * 100 : 20

    for (const item of order.items) {
      // For admin invoice, show prices excluding tax
      const unitPriceHT = item.unitPrice / (1 + taxRate / 100)
      const totalHT = item.total / (1 + taxRate / 100)

      doc.text(item.productName, 50, cursor, { width: 240 })
      doc.text(String(item.quantity), 300, cursor, { width: 50, align: 'right' })
      doc.text(formatPrice(unitPriceHT), 360, cursor, { width: 70, align: 'right' })
      doc.text(formatPrice(totalHT), 440, cursor, { width: 100, align: 'right' })
      cursor += 22
    }

    cursor += 10
    doc.moveTo(50, cursor).lineTo(550, cursor).strokeColor('#cbd5e1').stroke()
    cursor += 15

    // Totals section with detailed tax breakdown
    const subtotalHT = order.subtotal / (1 + taxRate / 100)
    const shippingHT = order.shippingCost / (1 + taxRate / 100)
    const totalHT = subtotalHT + shippingHT
    const totalTTC = order.total

    doc.fillColor('#0f172a')
    drawTotal(doc, 'Sous-total HT', subtotalHT, cursor)
    drawTotal(doc, 'Livraison HT', shippingHT, cursor + 18)
    drawTotal(doc, `TVA (${taxRate.toFixed(1)}%)`, order.tax, cursor + 36)
    doc.fontSize(12)
    drawTotal(doc, 'Total TTC', totalTTC, cursor + 56)

    cursor += 90
    doc.fontSize(10).fillColor('#475569')

    // Payment conditions and legal mentions
    doc.moveDown(2)
    cursor = doc.y

    doc.fontSize(9).fillColor('#0f172a').text('Conditions de paiement :', 50, cursor)
    doc.fontSize(8).fillColor('#475569')
    doc.text(`Paiement comptant à réception de facture`, 50, cursor + 15)
    doc.text(`Échéance : ${paymentDays} jours`, 50, cursor + 28)

    if (env.get('COMPANY_BANK_IBAN')) {
      doc.text(`RIB : ${env.get('COMPANY_BANK_IBAN')}`, 50, cursor + 41)
    }
    if (env.get('COMPANY_BANK_BIC')) {
      doc.text(`BIC : ${env.get('COMPANY_BANK_BIC')}`, 50, cursor + 54)
    }

    // Legal mentions for late payment (required by French law)
    cursor += 80
    doc.fontSize(7).fillColor('#64748b')
    doc.text(
      'Pénalités de retard : En cas de retard de paiement, seront exigibles, conformément à l\'article L441-10 du Code de commerce, ' +
        'des pénalités de retard calculées sur la base de trois fois le taux d\'intérêt légal.',
      50,
      cursor,
      { width: 500, align: 'left' }
    )

    cursor += 25
    doc.text(
      'Indemnité forfaitaire pour frais de recouvrement : En cas de retard de paiement, une indemnité forfaitaire de 40 € ' +
        'pour frais de recouvrement sera exigible, conformément aux articles L441-10 et D441-5 du Code de commerce.',
      50,
      cursor,
      { width: 500, align: 'left' }
    )

    // Discount for early payment (if applicable)
    const discountRate = env.get('COMPANY_EARLY_PAYMENT_DISCOUNT', 0)
    if (discountRate > 0) {
      cursor += 25
      doc.text(
        `Escompte pour paiement anticipé : ${discountRate}% en cas de paiement sous 8 jours.`,
        50,
        cursor,
        { width: 500 }
      )
    }

    // Additional legal mentions
    cursor += 25
    doc.fontSize(7).fillColor('#94a3b8')
    doc.text(
      'Aucun escompte ne sera accordé en cas de paiement anticipé. ' +
        'Les réglements sont à effectuer à l\'ordre d\'Althea Systems.',
      50,
      cursor,
      { width: 500, align: 'center' }
    )

    doc.end()
  })

  return filePath
}

function drawTotal(doc: PDFKit.PDFDocument, label: string, value: number, y: number) {
  doc.text(label, 360, y, { width: 80, align: 'right' })
  doc.text(formatPrice(value), 440, y, { width: 100, align: 'right' })
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    Number(value)
  )
}
