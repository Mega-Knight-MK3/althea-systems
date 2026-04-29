import { test } from '@japa/runner'
import { reply, welcomeMessage } from '#services/chatbot_brain'

test.group('chatbot brain', () => {
  test('matches the address-change FAQ', ({ assert }) => {
    const result = reply('Comment changer mon adresse ?')
    assert.equal(result.intent, 'address-change')
    assert.isFalse(result.shouldEscalate)
  })

  test('matches the payment FAQ', ({ assert }) => {
    const result = reply('Quels sont les moyens de paiement ?')
    assert.equal(result.intent, 'payment-methods')
  })

  test('escalates when the visitor asks for an agent', ({ assert }) => {
    const result = reply('Je veux parler à un humain')
    assert.equal(result.intent, 'escalate')
    assert.isTrue(result.shouldEscalate)
  })

  test('falls back when nothing matches', ({ assert }) => {
    const result = reply('Question complètement hors sujet')
    assert.equal(result.intent, 'fallback')
    assert.isFalse(result.shouldEscalate)
  })

  test('welcome message lists FAQ topics', ({ assert }) => {
    const message = welcomeMessage()
    assert.match(message, /assistant Althea/)
    assert.match(message, /paiement|adresse|livraison/i)
  })
})
