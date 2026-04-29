<script setup lang="ts">
type Locale = 'fr' | 'en' | 'ar'

interface SlideLocaleFields {
  eyebrow: string
  title: string
  body: string
  ctaLabel: string
}

interface Slide extends SlideLocaleFields {
  id?: number
  ctaUrl: string
  imageUrl: string
  isActive: boolean
  translations: Record<Locale, SlideLocaleFields>
}

interface HomepagePayload {
  slides: Array<{
    id: number
    eyebrow: string | null
    title: string
    body: string | null
    ctaLabel: string | null
    ctaUrl: string | null
    imageUrl: string | null
    isActive: boolean
    position: number
    translations?: Record<string, Partial<SlideLocaleFields>>
  }>
  introBody: string
  introTranslations?: Record<string, string>
}

const api = useApi()
const toast = useToast()

const LOCALES: Array<{ value: Locale, label: string }> = [
  { value: 'fr', label: 'Français (par défaut)' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' }
]

const activeLocale = ref<Locale>('fr')

const { data, refresh } = await useAsyncData<HomepagePayload>('admin-homepage', () =>
  api<HomepagePayload>('/admin/homepage')
)

const slides = ref<Slide[]>([])
const introBody = ref('')
const introTranslations = ref<Record<Locale, string>>({ fr: '', en: '', ar: '' })

watch(data, (value) => {
  if (!value) return
  slides.value = value.slides.map((s) => ({
    id: s.id,
    eyebrow: s.eyebrow ?? '',
    title: s.title,
    body: s.body ?? '',
    ctaLabel: s.ctaLabel ?? '',
    ctaUrl: s.ctaUrl ?? '',
    imageUrl: s.imageUrl ?? '',
    isActive: s.isActive,
    translations: {
      fr: { eyebrow: '', title: '', body: '', ctaLabel: '' },
      en: emptyTranslation(s.translations?.en),
      ar: emptyTranslation(s.translations?.ar)
    }
  }))
  introBody.value = value.introBody
  introTranslations.value = {
    fr: value.introBody,
    en: value.introTranslations?.en ?? '',
    ar: value.introTranslations?.ar ?? ''
  }
}, { immediate: true })

function emptyTranslation(source?: Partial<SlideLocaleFields>): SlideLocaleFields {
  return {
    eyebrow: source?.eyebrow ?? '',
    title: source?.title ?? '',
    body: source?.body ?? '',
    ctaLabel: source?.ctaLabel ?? ''
  }
}

const savingSlides = ref(false)
const savingIntro = ref(false)

function newSlide(): Slide {
  return {
    eyebrow: '',
    title: '',
    body: '',
    ctaLabel: '',
    ctaUrl: '',
    imageUrl: '',
    isActive: true,
    translations: {
      fr: { eyebrow: '', title: '', body: '', ctaLabel: '' },
      en: { eyebrow: '', title: '', body: '', ctaLabel: '' },
      ar: { eyebrow: '', title: '', body: '', ctaLabel: '' }
    }
  }
}

function addSlide() {
  if (slides.value.length >= 3) return
  slides.value = [...slides.value, newSlide()]
}

function removeSlide(index: number) {
  slides.value = slides.value.filter((_, i) => i !== index)
}

function move(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= slides.value.length) return
  const next = [...slides.value]
  const a = next[index]!
  const b = next[target]!
  next[index] = b
  next[target] = a
  slides.value = next
}

function fieldFor(slide: Slide, field: keyof SlideLocaleFields): string {
  if (activeLocale.value === 'fr') return slide[field]
  return slide.translations[activeLocale.value][field]
}

function setFieldFor(slide: Slide, field: keyof SlideLocaleFields, value: string) {
  if (activeLocale.value === 'fr') {
    slide[field] = value
  } else {
    slide.translations[activeLocale.value][field] = value
  }
}

const introBodyForLocale = computed({
  get: () => introTranslations.value[activeLocale.value] ?? '',
  set: (value: string) => {
    introTranslations.value[activeLocale.value] = value
    if (activeLocale.value === 'fr') introBody.value = value
  }
})

async function saveSlides() {
  if (savingSlides.value) return
  if (slides.value.some((s) => !s.title.trim())) {
    toast.add({ color: 'error', title: 'Chaque slide doit avoir un titre en français.' })
    return
  }
  savingSlides.value = true
  try {
    await api('/admin/homepage/slides', {
      method: 'PUT',
      body: {
        slides: slides.value.map((s) => ({
          eyebrow: s.eyebrow || null,
          title: s.title,
          body: s.body || null,
          ctaLabel: s.ctaLabel || null,
          ctaUrl: s.ctaUrl || null,
          imageUrl: s.imageUrl || null,
          isActive: s.isActive,
          translations: {
            en: s.translations.en,
            ar: s.translations.ar
          }
        }))
      }
    })
    toast.add({ color: 'success', title: 'Carrousel enregistré.' })
    refresh()
  } catch (err) {
    toast.add({ color: 'error', title: extractMessage(err, 'Erreur lors de l\'enregistrement.') })
  } finally {
    savingSlides.value = false
  }
}

async function saveIntro() {
  if (savingIntro.value) return
  savingIntro.value = true
  try {
    await api('/admin/homepage/intro', {
      method: 'PATCH',
      body: {
        body: introTranslations.value.fr || introBody.value,
        translations: {
          en: introTranslations.value.en || '',
          ar: introTranslations.value.ar || ''
        }
      }
    })
    toast.add({ color: 'success', title: 'Texte de présentation enregistré.' })
  } catch (err) {
    toast.add({ color: 'error', title: extractMessage(err, 'Erreur lors de l\'enregistrement.') })
  } finally {
    savingIntro.value = false
  }
}

function extractMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: { message?: string, errors?: Array<{ message: string }> } }).data
    if (data?.errors?.[0]?.message) return data.errors[0].message
    if (data?.message) return data.message
  }
  return fallback
}
</script>

<template>
  <UDashboardNavbar title="Carrousel d'accueil" />
  <div class="flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto p-4 sm:p-6">
    <div class="space-y-6 max-w-4xl">
      <UAlert
        color="primary"
        variant="subtle"
        icon="i-lucide-languages"
        title="Édition multilingue"
        description="Choisissez la langue à éditer. Le français est la version par défaut, l'anglais et l'arabe sont des traductions optionnelles servies selon la langue du visiteur."
      />

      <UTabs
        v-model="activeLocale"
        :items="LOCALES.map((l) => ({ label: l.label, value: l.value }))"
      />

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-semibold">Slides du carrousel</h2>
              <p class="text-sm text-muted">3 slides maximum. Réordonnez avec les flèches.</p>
            </div>
            <UButton
              icon="i-lucide-plus"
              :disabled="slides.length >= 3"
              label="Ajouter un slide"
              @click="addSlide"
            />
          </div>
        </template>

        <div v-if="!slides.length" class="py-8 text-center text-sm text-muted">
          Aucun slide configuré.
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="(slide, index) in slides"
            :key="index"
            class="rounded-lg border border-default p-4 space-y-3"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-medium">Slide {{ index + 1 }}</p>
              <div class="flex gap-1">
                <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-arrow-up" :disabled="index === 0" aria-label="Monter" @click="move(index, -1)" />
                <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-arrow-down" :disabled="index === slides.length - 1" aria-label="Descendre" @click="move(index, 1)" />
                <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" aria-label="Supprimer" @click="removeSlide(index)" />
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <UFormField label="Eyebrow">
                <UInput :model-value="fieldFor(slide, 'eyebrow')" class="w-full" @update:model-value="(v: string) => setFieldFor(slide, 'eyebrow', v)" />
              </UFormField>
              <UFormField :label="activeLocale === 'fr' ? 'Titre' : 'Titre (' + activeLocale + ')'" :required="activeLocale === 'fr'">
                <UInput :model-value="fieldFor(slide, 'title')" class="w-full" @update:model-value="(v: string) => setFieldFor(slide, 'title', v)" />
              </UFormField>
            </div>
            <UFormField label="Corps">
              <UTextarea :model-value="fieldFor(slide, 'body')" :rows="2" class="w-full" @update:model-value="(v: string) => setFieldFor(slide, 'body', v)" />
            </UFormField>
            <UFormField label="Texte du bouton">
              <UInput :model-value="fieldFor(slide, 'ctaLabel')" class="w-full" @update:model-value="(v: string) => setFieldFor(slide, 'ctaLabel', v)" />
            </UFormField>

            <USeparator label="Configuration partagée (toutes langues)" />

            <div class="grid gap-3 md:grid-cols-2">
              <UFormField label="Lien">
                <UInput v-model="slide.ctaUrl" class="w-full" placeholder="/categories/xxx" />
              </UFormField>
              <UFormField label="Image (URL)">
                <UInput v-model="slide.imageUrl" class="w-full" placeholder="https://..." />
              </UFormField>
            </div>
            <UFormField label="Affiché">
              <USwitch v-model="slide.isActive" :label="slide.isActive ? 'Actif' : 'Masqué'" />
            </UFormField>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton :loading="savingSlides" label="Enregistrer le carrousel" @click="saveSlides" />
          </div>
        </template>
      </UCard>

      <UCard>
        <template #header>
          <div>
            <h2 class="font-semibold">Texte de présentation</h2>
            <p class="text-sm text-muted">Affiché sous le carrousel. Édité dans la langue active : <strong>{{ activeLocale }}</strong>.</p>
          </div>
        </template>
        <ClientOnly>
          <RichTextEditor v-model="introBodyForLocale" />
          <template #fallback>
            <div class="border border-default rounded-lg p-3 min-h-32 text-sm text-muted">Chargement de l'éditeur…</div>
          </template>
        </ClientOnly>
        <template #footer>
          <div class="flex justify-end">
            <UButton :loading="savingIntro" label="Enregistrer le texte" @click="saveIntro" />
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
