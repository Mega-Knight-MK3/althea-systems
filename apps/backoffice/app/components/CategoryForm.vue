<script setup lang="ts">
import type { AdminCategory, LocaleCode, NamedTranslations } from '~/composables/useApiTypes'

interface Props {
  category?: AdminCategory | null
  parents: AdminCategory[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ saved: [AdminCategory] }>()

const api = useApi()
const router = useRouter()
const toast = useToast()

const LOCALES: Array<{ value: LocaleCode, label: string }> = [
  { value: 'fr', label: 'Français (par défaut)' },
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' }
]

const activeLocale = ref<LocaleCode>('fr')

interface LocaleFields {
  name: string
  description: string
}

const initialTranslations = (source?: NamedTranslations | null): Record<LocaleCode, LocaleFields> => ({
  fr: { name: '', description: '' },
  en: { name: source?.en?.name ?? '', description: source?.en?.description ?? '' },
  ar: { name: source?.ar?.name ?? '', description: source?.ar?.description ?? '' }
})

const state = reactive({
  name: props.category?.name ?? '',
  slug: props.category?.slug ?? '',
  description: props.category?.description ?? '',
  parentId: props.category?.parentId ?? null as number | null,
  imagePath: props.category?.imagePath ?? '',
  position: props.category?.position ?? 0,
  isActive: props.category?.isActive ?? true,
  translations: initialTranslations(props.category?.translations)
})
const submitting = ref(false)

const parentItems = computed(() => [
  { label: 'Aucune (racine)', value: null as number | null },
  ...props.parents
    .filter((c) => !props.category || c.id !== props.category.id)
    .map((c) => ({ label: c.name, value: c.id }))
])

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

watch(
  () => state.name,
  (name) => {
    if (!props.category && (!state.slug || state.slug === slugify(state.name.slice(0, -1)))) {
      state.slug = slugify(name)
    }
  }
)

const nameValue = computed({
  get: () => activeLocale.value === 'fr' ? state.name : state.translations[activeLocale.value].name,
  set: (value: string) => {
    if (activeLocale.value === 'fr') state.name = value
    else state.translations[activeLocale.value].name = value
  }
})

const descriptionValue = computed({
  get: () => activeLocale.value === 'fr' ? state.description : state.translations[activeLocale.value].description,
  set: (value: string) => {
    if (activeLocale.value === 'fr') state.description = value
    else state.translations[activeLocale.value].description = value
  }
})

async function submit() {
  if (submitting.value) return
  submitting.value = true
  try {
    const body = {
      name: state.name,
      slug: state.slug,
      description: state.description || undefined,
      parentId: state.parentId ?? null,
      imagePath: state.imagePath || null,
      position: state.position,
      isActive: state.isActive,
      translations: {
        en: { name: state.translations.en.name, description: state.translations.en.description },
        ar: { name: state.translations.ar.name, description: state.translations.ar.description }
      }
    }
    if (props.category) {
      const updated = await api<AdminCategory>(`/admin/categories/${props.category.id}`, { method: 'PATCH', body })
      toast.add({ color: 'success', title: 'Catégorie mise à jour.' })
      emit('saved', updated)
    } else {
      const created = await api<AdminCategory>('/admin/categories', { method: 'POST', body })
      toast.add({ color: 'success', title: 'Catégorie créée.' })
      router.replace(`/categories/${created.id}`)
    }
  } catch (err) {
    toast.add({ color: 'error', title: extractMessage(err, 'Erreur lors de l\'enregistrement.') })
  } finally {
    submitting.value = false
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
  <UForm :state="state" class="space-y-6" @submit.prevent="submit">
    <UTabs v-model="activeLocale" :items="LOCALES.map((l) => ({ label: l.label, value: l.value }))" />

    <div class="grid gap-4 md:grid-cols-2">
      <UFormField :label="activeLocale === 'fr' ? 'Nom' : 'Nom (' + activeLocale + ')'" :required="activeLocale === 'fr'">
        <UInput v-model="nameValue" class="w-full" />
      </UFormField>
      <UFormField label="Slug" required>
        <UInput v-model="state.slug" :disabled="activeLocale !== 'fr'" class="w-full" />
      </UFormField>
    </div>
    <UFormField :label="activeLocale === 'fr' ? 'Description' : 'Description (' + activeLocale + ')'">
      <UTextarea v-model="descriptionValue" :rows="3" class="w-full" />
    </UFormField>

    <USeparator label="Configuration partagée (toutes langues)" />

    <div class="grid gap-4 md:grid-cols-3">
      <UFormField label="Catégorie parente">
        <USelect v-model="state.parentId" :items="parentItems" class="w-full" />
      </UFormField>
      <UFormField label="Position">
        <UInput v-model.number="state.position" type="number" min="0" class="w-full" />
      </UFormField>
      <UFormField label="Image (chemin)">
        <UInput v-model="state.imagePath" class="w-full" placeholder="/images/cat.jpg" />
      </UFormField>
    </div>
    <UFormField label="Statut">
      <USwitch v-model="state.isActive" :label="state.isActive ? 'Active' : 'Désactivée'" />
    </UFormField>
    <div class="flex gap-2 justify-end">
      <UButton type="button" variant="ghost" color="neutral" label="Annuler" @click="router.push('/categories')" />
      <UButton type="submit" :loading="submitting" :label="props.category ? 'Enregistrer' : 'Créer la catégorie'" />
    </div>
  </UForm>
</template>
