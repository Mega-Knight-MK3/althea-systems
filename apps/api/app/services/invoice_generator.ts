import path from 'node:path'
import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import PDFDocument from 'pdfkit'
import app from '@adonisjs/core/services/app'
import type Order from '#models/order'

const INVOICE_DIR = 'storage/invoices'

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

    doc.fontSize(20).text('Althea Systems', { align: 'left' })
    doc.fontSize(10).fillColor('#475569').text('Matériel médical de pointe')
    doc.moveDown(2)

    doc.fontSize(16).fillColor('#0f172a').text(`Facture ${invoiceNumber}`)
    doc.fontSize(10).fillColor('#475569').text(`Date : ${new Date().toLocaleDateString('fr-FR')}`)
    doc.moveDown()

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

    const tableTop = doc.y
    doc.fontSize(10).fillColor('#0f172a')
    doc.text('Produit', 50, tableTop)
    doc.text('Qté', 320, tableTop, { width: 50, align: 'right' })
    doc.text('PU', 380, tableTop, { width: 70, align: 'right' })
    doc.text('Total', 460, tableTop, { width: 90, align: 'right' })
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .strokeColor('#cbd5e1')
      .stroke()

    let cursor = tableTop + 25
    doc.fillColor('#475569')
    for (const item of order.items) {
      doc.text(item.productName, 50, cursor, { width: 260 })
      doc.text(String(item.quantity), 320, cursor, { width: 50, align: 'right' })
      doc.text(formatPrice(item.unitPrice), 380, cursor, { width: 70, align: 'right' })
      doc.text(formatPrice(item.total), 460, cursor, { width: 90, align: 'right' })
      cursor += 22
    }

    cursor += 10
    doc
      .moveTo(50, cursor)
      .lineTo(550, cursor)
      .strokeColor('#cbd5e1')
      .stroke()
    cursor += 15

    doc.fillColor('#0f172a')
    drawTotal(doc, 'Sous-total', order.subtotal, cursor)
    drawTotal(doc, 'Livraison', order.shippingCost, cursor + 18)
    drawTotal(doc, 'TVA', order.tax, cursor + 36)
    doc.fontSize(12)
    drawTotal(doc, 'Total', order.total, cursor + 56)

    doc.end()
  })

  return filePath
}

function drawTotal(doc: PDFKit.PDFDocument, label: string, value: number, y: number) {
  doc.text(label, 380, y, { width: 70, align: 'right' })
  doc.text(formatPrice(value), 460, y, { width: 90, align: 'right' })
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value))
}
