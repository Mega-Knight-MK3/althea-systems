import vine from '@vinejs/vine'

export const listMessagesValidator = vine.compile(
  vine.object({
    q: vine.string().trim().minLength(1).maxLength(120).optional(),
    status: vine.enum(['all', 'unread', 'read'] as const).optional(),
    page: vine.number().withoutDecimals().min(1).optional(),
    perPage: vine.number().withoutDecimals().min(1).max(100).optional(),
  })
)

export const listChatSessionsValidator = vine.compile(
  vine.object({
    q: vine.string().trim().minLength(1).maxLength(120).optional(),
    status: vine.enum(['all', 'escalated', 'unread'] as const).optional(),
    page: vine.number().withoutDecimals().min(1).optional(),
    perPage: vine.number().withoutDecimals().min(1).max(100).optional(),
  })
)

export const agentReplyValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1).maxLength(4000),
  })
)
