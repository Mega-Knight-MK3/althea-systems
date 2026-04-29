import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import HomepageSlide from '#models/homepage_slide'
import SiteSetting from '#models/site_setting'
import { replaceSlidesValidator, updateIntroValidator } from '#validators/homepage'

export const INTRO_BODY_KEY = 'homepage_intro_body'

export default class AdminHomepageController {
  async show() {
    const [slides, intro] = await Promise.all([
      HomepageSlide.query().orderBy('position', 'asc'),
      SiteSetting.find(INTRO_BODY_KEY),
    ])
    return {
      slides,
      introBody: intro?.value ?? '',
    }
  }

  async replaceSlides({ request }: HttpContext) {
    const { slides } = await request.validateUsing(replaceSlidesValidator)
    const result = await db.transaction(async (trx) => {
      await trx.from('homepage_slides').delete()
      const inserted: HomepageSlide[] = []
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i]!
        const created = await HomepageSlide.create(
          {
            eyebrow: slide.eyebrow ?? null,
            title: slide.title,
            body: slide.body ?? null,
            ctaLabel: slide.ctaLabel ?? null,
            ctaUrl: slide.ctaUrl ?? null,
            imageUrl: slide.imageUrl ?? null,
            position: i,
            isActive: slide.isActive ?? true,
          },
          { client: trx }
        )
        inserted.push(created)
      }
      return inserted
    })
    return { slides: result }
  }

  async updateIntro({ request }: HttpContext) {
    const { body } = await request.validateUsing(updateIntroValidator)
    const existing = await SiteSetting.find(INTRO_BODY_KEY)
    if (existing) {
      existing.value = body
      await existing.save()
    } else {
      await SiteSetting.create({ key: INTRO_BODY_KEY, value: body })
    }
    return { introBody: body }
  }
}
