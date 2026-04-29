import { test } from '@japa/runner'

test.group('health and docs', () => {
  test('GET / returns the hello payload', async ({ client }) => {
    const response = await client.get('/')
    response.assertStatus(200)
    response.assertBodyContains({ hello: 'world' })
  })

  test('GET /docs serves Swagger UI', async ({ client }) => {
    const response = await client.get('/docs')
    response.assertStatus(200)
    response.assertTextIncludes('SwaggerUIBundle')
  })

  test('GET /openapi.yaml returns the spec', async ({ client }) => {
    const response = await client.get('/openapi.yaml')
    response.assertStatus(200)
    response.assertTextIncludes('openapi: 3.1.0')
  })
})
