import { test } from '@japa/runner'
import { clearAll, consume, reset } from '#services/rate_limiter'

test.group('rate limiter', (group) => {
  group.each.setup(() => clearAll())

  test('allows up to max hits', ({ assert }) => {
    for (let i = 0; i < 3; i++) {
      const r = consume('user-a', { max: 3, windowMs: 60_000 })
      assert.isTrue(r.allowed)
    }
  })

  test('blocks once max is reached', ({ assert }) => {
    for (let i = 0; i < 3; i++) consume('user-b', { max: 3, windowMs: 60_000 })
    const r = consume('user-b', { max: 3, windowMs: 60_000 })
    assert.isFalse(r.allowed)
    assert.isAbove(r.retryAfterSeconds, 0)
  })

  test('reset clears the bucket', ({ assert }) => {
    for (let i = 0; i < 3; i++) consume('user-c', { max: 3, windowMs: 60_000 })
    reset('user-c')
    const r = consume('user-c', { max: 3, windowMs: 60_000 })
    assert.isTrue(r.allowed)
  })

  test('different keys do not collide', ({ assert }) => {
    consume('user-d', { max: 1, windowMs: 60_000 })
    const r = consume('user-e', { max: 1, windowMs: 60_000 })
    assert.isTrue(r.allowed)
  })
})
