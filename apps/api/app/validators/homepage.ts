import vine from '@vinejs/vine'

const slideShape = vine.object({
  id: vine.number().positive().optional(),
  eyebrow: vine.string().trim().maxLength(80).nullable().optional(),
  title: vine.string().trim().minLength(1).maxLength(200),
  body: vine.string().trim().maxLength(800).nullable().optional(),
  ctaLabel: vine.string().trim().maxLength(80).nullable().optional(),
  ctaUrl: vine.string().trim().maxLength(255).nullable().optional(),
  imageUrl: vine.string().trim().maxLength(500).nullable().optional(),
  isActive: vine.boolean().optional(),
})

export const replaceSlidesValidator = vine.compile(
  vine.object({
    slides: vine.array(slideShape).maxLength(3),
  })
)

export const updateIntroValidator = vine.compile(
  vine.object({
    body: vine.string().trim().maxLength(8000),
  })
)
