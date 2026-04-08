import vine from '@vinejs/vine'

const slug = vine
  .string()
  .trim()
  .minLength(2)
  .maxLength(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const createCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120),
    slug: slug.clone().unique({ table: 'categories', column: 'slug' }),
    description: vine.string().trim().maxLength(2000).optional(),
    parentId: vine.number().positive().optional(),
    imagePath: vine.string().trim().maxLength(255).optional(),
    position: vine.number().withoutDecimals().min(0).optional(),
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
  })
)
