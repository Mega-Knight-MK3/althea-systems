import type { HttpContext } from '@adonisjs/core/http'
import ContactMessage from '#models/contact_message'
import ChatbotSession from '#models/chatbot_session'
import ChatbotMessage from '#models/chatbot_message'
import {
  agentReplyValidator,
  listChatSessionsValidator,
  listMessagesValidator,
} from '#validators/admin_messages'

export default class AdminMessagesController {
  async indexContact({ request }: HttpContext) {
    const { q, status, page = 1, perPage = 25 } = await listMessagesValidator.validate(request.qs())
    const builder = ContactMessage.query()
    if (status === 'unread') builder.where('isRead', false)
    else if (status === 'read') builder.where('isRead', true)
    if (q) {
      const pattern = `%${q}%`
      builder.where((sub) => {
        sub
          .whereILike('email', pattern)
          .orWhereILike('name', pattern)
          .orWhereILike('subject', pattern)
          .orWhereILike('message', pattern)
      })
    }
    builder.orderBy('createdAt', 'desc')
    const result = await builder.paginate(page, perPage)
    return { meta: result.getMeta(), data: result.all() }
  }

  async showContact({ params }: HttpContext) {
    const message = await ContactMessage.findOrFail(params.id)
    if (!message.isRead) {
      message.isRead = true
      await message.save()
    }
    return message
  }

  async markContactRead({ params, request, response }: HttpContext) {
    const message = await ContactMessage.findOrFail(params.id)
    const isRead = request.input('isRead', true)
    message.isRead = !!isRead
    await message.save()
    return response.noContent()
  }

  async indexChat({ request }: HttpContext) {
    const { q, status, page = 1, perPage = 25 } = await listChatSessionsValidator.validate(
      request.qs()
    )
    const builder = ChatbotSession.query().preload('user')
    if (status === 'escalated') builder.where('escalated', true)
    else if (status === 'unread') builder.where('isRead', false)
    if (q) {
      const pattern = `%${q}%`
      builder.where((sub) => {
        sub
          .whereILike('visitorEmail', pattern)
          .orWhereILike('visitorName', pattern)
          .orWhereILike('subject', pattern)
      })
    }
    builder.orderBy('createdAt', 'desc')
    const result = await builder.paginate(page, perPage)
    return {
      meta: result.getMeta(),
      data: result.all().map((session) => ({
        ...session.serialize(),
        identity:
          session.visitorName || session.visitorEmail || session.user?.email || 'Visiteur anonyme',
      })),
    }
  }

  async showChat({ params }: HttpContext) {
    const session = await ChatbotSession.query()
      .where('id', params.id)
      .preload('user')
      .firstOrFail()
    const messages = await ChatbotMessage.query()
      .where('sessionId', session.id)
      .orderBy('createdAt', 'asc')
    if (!session.isRead) {
      session.isRead = true
      await session.save()
    }
    return { session, messages }
  }

  async replyChat({ params, request }: HttpContext) {
    const session = await ChatbotSession.findOrFail(params.id)
    const { content } = await request.validateUsing(agentReplyValidator)
    const message = await ChatbotMessage.create({
      sessionId: session.id,
      role: 'agent',
      content,
    })
    session.isRead = true
    await session.save()
    return { message, session }
  }
}
