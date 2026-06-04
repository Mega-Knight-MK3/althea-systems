import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import Invoice from '#models/invoice'
import CreditNote from '#models/credit_note'
import Order from '#models/order'
import {
  createCreditNoteValidator,
  listInvoicesValidator,
} from '#validators/admin_invoices'
import { generateCreditNotePdf } from '#services/credit_note_generator'
import { sendInvoiceCopy, sendCreditNoteCopy } from '#services/account_mailer'

export default class AdminInvoicesController {
  async indexInvoices({ request }: HttpContext) {
    const { q, page = 1, perPage = 25 } = await listInvoicesValidator.validate(request.qs())
    const builder = Invoice.query()
      .preload('order', (orderQuery) => orderQuery.preload('user'))

    if (q) {
      const pattern = `%${q}%`
      builder.where((sub) => {
        sub.whereILike('invoiceNumber', pattern).orWhereHas('order', (orderQuery) => {
          orderQuery.whereHas('user', (userQuery) => {
            userQuery.where((userSub) => {
              userSub.whereILike('email', pattern).orWhereILike('full_name', pattern)
            })
          })
        })
      })
    }

    builder.orderBy('issuedAt', 'desc')
    const result = await builder.paginate(page, perPage)
    return {
      meta: result.getMeta(),
      data: result.all().map((invoice) => ({
        ...invoice.serialize(),
        customer: invoice.order?.user?.fullName || invoice.order?.user?.email || 'Client',
        customerEmail: invoice.order?.user?.email ?? null,
        orderStatus: invoice.order?.status ?? null,
      })),
    }
  }

  async indexCreditNotes({ request }: HttpContext) {
    const { q, page = 1, perPage = 25 } = await listInvoicesValidator.validate(request.qs())
    const builder = CreditNote.query()
      .preload('invoice', (invoiceQuery) =>
        invoiceQuery.preload('order', (orderQuery) => orderQuery.preload('user'))
      )

    if (q) {
      const pattern = `%${q}%`
      builder.where((sub) => {
        sub
          .whereILike('creditNoteNumber', pattern)
          .orWhereHas('invoice', (invoiceQuery) => invoiceQuery.whereILike('invoiceNumber', pattern))
      })
    }

    builder.orderBy('issuedAt', 'desc')
    const result = await builder.paginate(page, perPage)
    return {
      meta: result.getMeta(),
      data: result.all().map((cn) => ({
        ...cn.serialize(),
        invoiceNumber: cn.invoice?.invoiceNumber ?? null,
        customer: cn.invoice?.order?.user?.fullName || cn.invoice?.order?.user?.email || 'Client',
      })),
    }
  }

  async downloadInvoice({ params, response }: HttpContext) {
    const invoice = await Invoice.findOrFail(params.id)

    // Admin downloads the detailed administrative invoice
    const pdfPath = invoice.adminPdfPath || invoice.pdfPath
    if (!pdfPath) {
      return response.notFound({ message: 'PDF indisponible.' })
    }

    // Verify file exists before streaming
    try {
      await fs.access(pdfPath, fs.constants.R_OK)
    } catch {
      return response.notFound({ message: 'Le fichier PDF est introuvable.' })
    }

    response.header('Content-Type', 'application/pdf')
    response.header(
      'Content-Disposition',
      `attachment; filename="${invoice.invoiceNumber}-admin.pdf"`
    )
    return response.stream(createReadStream(pdfPath))
  }

  async resendInvoice({ params, response }: HttpContext) {
    const invoice = await Invoice.findOrFail(params.id)
    await invoice.load('order', (orderQuery) => orderQuery.preload('user'))
    const user = invoice.order?.user
    if (!user) return response.notFound({ message: 'Destinataire introuvable.' })
    await sendInvoiceCopy(user, invoice.invoiceNumber)
    return response.accepted({ message: 'Email envoyé.' })
  }

  async createCreditNote({ request, response }: HttpContext) {
    const { invoiceId, amount, reason } = await request.validateUsing(createCreditNoteValidator)
    const invoice = await Invoice.findOrFail(invoiceId)
    await invoice.load('order', (orderQuery) => orderQuery.preload('user'))

    const order = invoice.order
    const user = order?.user
    if (!order || !user) {
      return response.unprocessableEntity({ message: 'Commande ou client introuvable.' })
    }

    const lastCount = await CreditNote.query().count('* as total')
    const total = Number(lastCount[0]?.$extras?.total ?? 0) + 1
    const creditNoteNumber = `AVO-${DateTime.now().toFormat('yyyyLLdd')}-${String(total).padStart(5, '0')}`

    const creditNote = await CreditNote.create({
      invoiceId: invoice.id,
      creditNoteNumber,
      amount,
      reason: reason ?? null,
      issuedAt: DateTime.now(),
    })

    const customerName = user.fullName ?? user.email
    creditNote.pdfPath = await generateCreditNotePdf(creditNote, invoice, customerName)
    await creditNote.save()

    return response.created({ creditNote })
  }

  async downloadCreditNote({ params, response }: HttpContext) {
    const creditNote = await CreditNote.findOrFail(params.id)
    if (!creditNote.pdfPath) {
      return response.notFound({ message: 'PDF indisponible.' })
    }
    response.header('Content-Type', 'application/pdf')
    response.header(
      'Content-Disposition',
      `attachment; filename="${creditNote.creditNoteNumber}.pdf"`
    )
    return response.stream(createReadStream(creditNote.pdfPath))
  }

  async resendCreditNote({ params, response }: HttpContext) {
    const creditNote = await CreditNote.findOrFail(params.id)
    await creditNote.load('invoice', (invoiceQuery) =>
      invoiceQuery.preload('order', (orderQuery) => orderQuery.preload('user'))
    )
    const user = creditNote.invoice?.order?.user
    if (!user) return response.notFound({ message: 'Destinataire introuvable.' })
    await sendCreditNoteCopy(user, creditNote.creditNoteNumber)
    return response.accepted({ message: 'Email envoyé.' })
  }
}

// Force eager loading helpers
void Order
void fs
