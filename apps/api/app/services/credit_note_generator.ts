import path from 'node:path'
import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import PDFDocument from 'pdfkit'
import app from '@adonisjs/core/services/app'
import type CreditNote from '#models/credit_note'
import type Invoice from '#models/invoice'

const CREDIT_NOTE_DIR = 'storage/credit-notes'

export async function generateCreditNotePdf(
  creditNote: CreditNote,
  invoice: Invoice,
  customerName: string
): Promise<string> {
  const dir = app.makePath(CREDIT_NOTE_DIR)
  await fs.mkdir(dir, { recursive: true })
  const filePath = path.join(dir, `${creditNote.creditNoteNumber}.pdf`)

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const stream = createWriteStream(filePath)
    stream.on('finish', resolve)
    stream.on('error', reject)
    doc.pipe(stream)

    doc.fontSize(20).text('Althea Systems', { align: 'left' })
    doc.fontSize(10).fillColor('#475569').text('Matériel médical de pointe')
    doc.moveDown(2)

    doc.fontSize(16).fillColor('#0f172a').text(`Avoir ${creditNote.creditNoteNumber}`)
    doc.fontSize(10).fillColor('#475569').text(`Date : ${new Date().toLocaleDateString('fr-FR')}`)
    doc.text(`Facture liée : ${invoice.invoiceNumber}`)
    doc.moveDown()

    doc.fontSize(11).fillColor('#0f172a').text('Émis pour')
    doc.fontSize(10).fillColor('#475569').text(customerName)
    doc.moveDown()

    if (creditNote.reason) {
      doc.fontSize(11).fillColor('#0f172a').text('Motif')
      doc.fontSize(10).fillColor('#475569').text(creditNote.reason)
      doc.moveDown()
    }

    doc.fontSize(12).fillColor('#0f172a').text(`Montant : ${formatPrice(creditNote.amount)}`, { align: 'right' })
    doc.end()
  })

  return filePath
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value))
}
