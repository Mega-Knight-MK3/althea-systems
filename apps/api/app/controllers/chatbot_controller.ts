import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import ChatbotSession from '#models/chatbot_session'
import ChatbotMessage from '#models/chatbot_message'
import {
  escalateValidator,
  postMessageValidator,
  startSessionValidator,
} from '#validators/chatbot'
import { FAQ_SHORTCUTS, reply, welcomeMessage } from '#services/chatbot_brain'
import { broadcastNewMessage, notifyEscalation } from '#services/chatbot_transmit'

export default class ChatbotController {
  async start({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(startSessionValidator)
    const session = await ChatbotSession.create({
      userId: auth.user?.id ?? null,
      visitorName: payload.name ?? auth.user?.fullName ?? null,
      visitorEmail: payload.email ?? auth.user?.email ?? null,
      subject: payload.subject ?? null,
      escalated: false,
      isRead: false,
    })

    const greeting = await ChatbotMessage.create({
      sessionId: session.id,
      role: 'bot',
      content: welcomeMessage(),
      intent: 'welcome',
    })

    return response.created({
      session,
      messages: [greeting],
      faqShortcuts: FAQ_SHORTCUTS,
    })
  }

  async postMessage({ params, request, response }: HttpContext) {
    const session = await ChatbotSession.findOrFail(params.id)
    const { content } = await request.validateUsing(postMessageValidator)

    const userMessage = await ChatbotMessage.create({
      sessionId: session.id,
      role: 'user',
      content,
    })

    const messages = [userMessage]

    if (session.isOperatorControlled) {
      return response.created({ messages })
    }

    if (session.escalated) {
      return response.created({ messages })
    }

    const brain = reply(content)
    const botMessage = await ChatbotMessage.create({
      sessionId: session.id,
      role: 'bot',
      content: brain.content,
      intent: brain.intent,
    })
    messages.push(botMessage)

    await broadcastNewMessage(session.id, botMessage)

    if (brain.shouldEscalate && !session.escalated) {
      session.escalated = true
      session.escalatedAt = DateTime.now()
      session.isRead = false
      await session.save()
    }

    return response.created({ messages, session })
  }

  async escalate({ params, request, response }: HttpContext) {
    const session = await ChatbotSession.findOrFail(params.id)
    const payload = await request.validateUsing(escalateValidator)

    session.merge({
      visitorName: payload.name ?? session.visitorName,
      visitorEmail: payload.email,
      subject: payload.subject ?? session.subject,
      escalated: true,
      escalatedAt: session.escalatedAt ?? DateTime.now(),
      isRead: false,
    })
    await session.save()

    await notifyEscalation(session)

    const note = await ChatbotMessage.create({
      sessionId: session.id,
      role: 'bot',
      content: `Merci ${payload.name ?? ''}. Un conseiller va prendre contact à ${payload.email}.`.trim(),
      intent: 'escalation-confirmed',
    })

    return response.accepted({ session, message: note })
  }
}
