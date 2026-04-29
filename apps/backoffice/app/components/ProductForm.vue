<script setup lang="ts">
import type { AdminCategory, AdminProduct } from '~/composables/useApiTypes'

interface Props {
  product?: AdminProduct | null
  categories: AdminCategory[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ saved: [AdminProduct] }>()

const api = useApi()
const router = useRouter()
const toast = useToast()

interface FormState {
  name: string
  slug: string
  description: string
  price: number
  vatRate: number
  stock: number
  categoryId: number | null
  isActive: boolean
  sortPriority: number
}

const state = reactive<FormState>({
  name: props.product?.name ?? '',
  slug: props.product?.slug ?? '',
  description: props.product?.description ?? '',
  price: props.product?.price !== undefined ? Number(props.product.price) : 0,
  vatRate: props.product?.vatRate ?? 20,
  stock: props.product?.stock ?? 0,
  categoryId: props.product?.categoryId ?? null,
  isActive: props.product?.isActive ?? false,
  sortPriority: props.product?.sortPriority ?? 0
})

const submitting = ref(false)

const ttc = computed(() => {
  const ht = Number(state.price) || 0
  return ht + (ht * Number(state.vatRate)) / 100
})

const categoryItems = computed(() => [
  { label: 'Sans catégorie', value: null as number | null },
  ...props.categories.map((c) => ({ label: c.name, value: c.id }))
])

const vatItems = [
  { label: '20 %', value: 20 },
  { label: '10 %', value: 10 },
  { label: '5,5 %', value: 5.5 },
  { label: '0 %', value: 0 }
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

watch(
  () => state.name,
  (name) => {
    if (!props.product && (!state.slug || state.slug === slugify(state.name.slice(0, -1)))) {
      state.slug = slugify(name)
    }
  }
)

async function submit() {
  if (submitting.value) return
  submitting.value = true
  try {
    const body = {
      name: state.name,
      slug: state.slug,
      description: state.description || undefined,
      price: state.price,
      vatRate: state.vatRate,
      stock: state.stock,
      categoryId: state.categoryId ?? null,
      isActive: state.isActive,
      sortPriority: state.sortPriority
    }
    if (props.product) {
      const updated = await api<AdminProduct>(`/admin/products/${props.product.id}`, {
        method: 'PATCH',
        body
      })
      toast.add({ color: 'success', title: 'Produit mis à jour.' })
      emit('saved', updated)
    } else {
      const created = await api<AdminProduct>('/admin/products', { method: 'POST', body })
      toast.add({ color: 'success', title: 'Produit créé.' })
      router.replace(`/products/${created.id}`)
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
    <div class="grid gap-4 md:grid-cols-2">
      <UFormField label="Nom" required>
        <UInput v-model="state.name" class="w-full" />
      </UFormField>
      <UFormField label="Slug" required>
        <UInput v-model="state.slug" class="w-full" />
      </UFormField>
    </div>

    <UFormField label="Description">
      <UTextarea v-model="state.description" :rows="4" class="w-full" />
    </UFormField>

    <div class="grid gap-4 md:grid-cols-3">
      <UFormField label="Prix HT" required>
        <UInput v-model.number="state.price" type="number" step="0.01" min="0" class="w-full" />
      </UFormField>
      <UFormField label="TVA">
        <USelect v-model="state.vatRate" :items="vatItems" class="w-full" />
      </UFormField>
      <UFormField label="Prix TTC (calculé)">
        <UInput :value="ttc.toFixed(2)" disabled class="w-full" />
      </UFormField>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <UFormField label="Stock">
        <UInput v-model.number="state.stock" type="number" min="0" class="w-full" />
      </UFormField>
      <UFormField label="Catégorie">
        <USelect v-model="state.categoryId" :items="categoryItems" class="w-full" />
      </UFormField>
      <UFormField label="Priorité de tri">
        <UInput v-model.number="state.sortPriority" type="number" min="0" class="w-full" />
      </UFormField>
    </div>

    <UFormField label="Statut">
      <USwitch v-model="state.isActive" :label="state.isActive ? 'Publié' : 'Brouillon'" />
    </UFormField>

    <div class="flex gap-2 justify-end">
      <UButton type="button" variant="ghost" color="neutral" label="Annuler" @click="router.push('/products')" />
      <UButton type="submit" :loading="submitting" :label="props.product ? 'Enregistrer' : 'Créer le produit'" />
    </div>
  </UForm>
</template>
