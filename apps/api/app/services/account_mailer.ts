import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import type User from '#models/user'

function buildLink(path: string, token: string) {
  const base = env.get('STOREFRONT_URL').replace(/\/$/, '')
  return `${base}${path}?token=${encodeURIComponent(token)}`
}

async function deliver(payload: { to: string; subject: string; html: string; link?: string }) {
  if (env.get('MAIL_DRIVER', 'log') === 'log') {
    logger.info({ to: payload.to, subject: payload.subject, link: payload.link }, 'mail.log')
    return
  }
  try {
    await mail.send((message) => {
      message.to(payload.to).subject(payload.subject).html(payload.html)
    })
  } catch (err) {
    logger.error({ err, to: payload.to, subject: payload.subject, link: payload.link }, 'mail.send.failed')
  }
}

export async function sendInvoiceCopy(user: User, invoiceNumber: string) {
  await deliver({
    to: user.email,
    subject: `Votre facture ${invoiceNumber}`,
    html: `<p>Bonjour ${user.fullName ?? ''},</p>
      <p>Votre facture ${invoiceNumber} est disponible dans votre espace client.</p>`,
  })
}

export async function sendCreditNoteCopy(user: User, creditNoteNumber: string) {
  await deliver({
    to: user.email,
    subject: `Avoir ${creditNoteNumber}`,
    html: `<p>Bonjour ${user.fullName ?? ''},</p>
      <p>Un avoir ${creditNoteNumber} a été émis sur votre compte. Vous pouvez le consulter dans votre espace client.</p>`,
  })
}

export async function sendEmailVerification(user: User, token: string, email: string) {
  const link = buildLink('/verify-email', token)
  await deliver({
    to: email,
    subject: 'Confirmez votre adresse email',
    link,
    html: `<p>Bonjour ${user.fullName ?? ''},</p>
      <p>Confirmez votre adresse email en cliquant sur le lien suivant (valable 24 heures) :</p>
      <p><a href="${link}">${link}</a></p>`,
  })
}

export async function sendPasswordReset(user: User, token: string) {
  const link = buildLink('/reset-password', token)
  await deliver({
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe',
    link,
    html: `<p>Bonjour ${user.fullName ?? ''},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe. Ce lien expire dans 24 heures :</p>
      <p><a href="${link}">${link}</a></p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
  })
}
