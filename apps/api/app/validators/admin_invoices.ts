import vine from '@vinejs/vine'

export const listInvoicesValidator = vine.compile(
  vine.object({
    q: vine.string().trim().minLength(1).maxLength(120).optional(),
    page: vine.number().withoutDecimals().min(1).optional(),
    perPage: vine.number().withoutDecimals().min(1).max(100).optional(),
  })
)

export const createCreditNoteValidator = vine.compile(
  vine.object({
    invoiceId: vine.number().positive(),
    amount: vine.number().positive(),
    reason: vine.string().trim().maxLength(500).optional(),
  })
)
