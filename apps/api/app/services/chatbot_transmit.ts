import { getIO } from '#services/socket_server'
import ChatbotMessage from '#models/chatbot_message'
import ChatbotSession from '#models/chatbot_session'
import User from '#models/user'

export async function broadcastNewMessage(sessionId: number, message: ChatbotMessage) {
  try {
    const io = getIO()
    io.to(`session:${sessionId}`).emit('message:new', {
      id: message.id,
      sessionId: message.sessionId,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISO(),
    })
  } catch (error) {
    console.error('Failed to broadcast message:', error)
  }
}

export async function notifyTakeover(sessionId: number, operator: User) {
  try {
    const io = getIO()
    io.to(`session:${sessionId}`).emit('takeover:started', {
      operatorName: operator.fullName,
      operatorId: operator.id,
    })
  } catch (error) {
    console.error('Failed to notify takeover:', error)
  }
}

export async function notifyHandback(sessionId: number) {
  try {
    const io = getIO()
    io.to(`session:${sessionId}`).emit('takeover:ended', {})
  } catch (error) {
    console.error('Failed to notify handback:', error)
  }
}

export async function notifyEscalation(session: ChatbotSession) {
  try {
    const io = getIO()
    io.to('operators').emit('session:escalated', {
      sessionId: session.id,
      visitorName: session.visitorName,
      visitorEmail: session.visitorEmail,
      subject: session.subject,
      escalatedAt: session.escalatedAt?.toISO(),
    })
  } catch (error) {
    console.error('Failed to notify escalation:', error)
  }
}
