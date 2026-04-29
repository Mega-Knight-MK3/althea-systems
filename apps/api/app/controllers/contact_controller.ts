import type { HttpContext } from '@adonisjs/core/http'
import ContactMessage from '#models/contact_message'
import { submitContactValidator } from '#validators/contact'

export default class ContactController {
  async store({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(submitContactValidator)
    const userId = auth.user?.id ?? null
    const message = await ContactMessage.create({
      userId,
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      message: payload.message,
      isRead: false,
    })
    return response.created({
      message: 'Votre message a bien été envoyé. Notre équipe vous répondra rapidement.',
      id: message.id,
    })
  }
}
