import vine from '@vinejs/vine'

const slug = vine
  .string()
  .trim()
  .minLength(2)
  .maxLength(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

const namedTranslation = vine.object({
  name: vine.string().trim().maxLength(120).nullable().optional(),
  description: vine.string().trim().maxLength(2000).nullable().optional(),
})

export const createCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120),
    slug: slug.clone().unique({ table: 'categories', column: 'slug' }),
    description: vine.string().trim().maxLength(2000).optional(),
    parentId: vine.number().positive().optional(),
    imagePath: vine.string().trim().maxLength(255).optional(),
    position: vine.number().withoutDecimals().min(0).optional(),
    isActive: vine.boolean().optional(),
    translations: vine.record(namedTranslation).optional(),
  })
)

export const updateCategoryValidator = vine.withMetaData<{ categoryId: number }>().compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120).optional(),
    slug: slug
      .clone()
      .unique(async (db, value, field) => {
        const row = await db
          .from('categories')
          .where('slug', value)
          .whereNot('id', field.meta.categoryId)
          .first()
        return !row
      })
      .optional(),
    description: vine.string().trim().maxLength(2000).nullable().optional(),
    parentId: vine.number().positive().nullable().optional(),
    imagePath: vine.string().trim().maxLength(255).nullable().optional(),
    position: vine.number().withoutDecimals().min(0).optional(),
    isActive: vine.boolean().optional(),
    translations: vine.record(namedTranslation).optional(),
  })
)

export const reorderCategoriesValidator = vine.compile(
  vine.object({
    items: vine
      .array(
        vine.object({
          id: vine.number().positive(),
          position: vine.number().withoutDecimals().min(0),
        })
      )
      .minLength(1)
      .maxLength(500),
  })
)

export const bulkSetCategoryStatusValidator = vine.compile(
  vine.object({
    ids: vine.array(vine.number().positive()).minLength(1).maxLength(200),
    isActive: vine.boolean(),
  })
)
