<script setup lang="ts">
import type { SortOption } from '~/components/AppSortMenu.vue'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: category } = await useCategory(slug)

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Catégorie introuvable' })
}

useHead(() => ({ title: `${category.value?.name ?? 'Catégorie'} — Althea Systems` }))

const sortOptions: SortOption[] = [
  { value: 'priority-desc', label: 'Mis en avant', sort: 'priority', order: 'desc' },
  { value: 'price-asc', label: 'Prix croissant', sort: 'price', order: 'asc' },
  { value: 'price-desc', label: 'Prix décroissant', sort: 'price', order: 'desc' },
  { value: 'date-desc', label: 'Nouveautés', sort: 'date', order: 'desc' },
  { value: 'stock-desc', label: 'Stock disponible', sort: 'stock', order: 'desc' },
]

const selectedSort = ref('priority-desc')
const inStockOnly = ref(false)

const productParams = computed(() => {
  const option = sortOptions.find((o) => o.value === selectedSort.value)!
  return {
    categoryId: category.value!.id,
    sort: option.sort,
    order: option.order,
    inStockOnly: inStockOnly.value || undefined,
    perPage: 24,
  }
})

const { data: productsResult } = await useProducts(productParams)
const products = computed(() => productsResult.value?.data ?? [])
const isMobile = useMediaQuery()
</script>

<template>
  <div>
    <header class="bg-brand-50">
      <div class="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-10 md:py-16">
        <p class="text-caption text-brand-500 uppercase tracking-widest">Catégorie</p>
        <h1 class="font-display text-h1 mt-3 font-medium text-brand-text">
          {{ category!.name }}
        </h1>
        <p v-if="category!.description" class="mt-4 max-w-2xl text-body-lg text-neutral-700">
          {{ category!.description }}
        </p>
      </div>
    </header>

    <section class="mx-auto w-full max-w-[1440px] px-4 py-10 md:px-10 md:py-12">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <p class="text-sm text-neutral-600">
          {{ productsResult?.meta?.total ?? 0 }} produit{{
            (productsResult?.meta?.total ?? 0) > 1 ? 's' : ''
          }}
        </p>
        <div class="flex items-center gap-4">
          <label class="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              v-model="inStockOnly"
              type="checkbox"
              class="accent-brand-500 h-4 w-4 rounded border-neutral-300"
            />
            Uniquement en stock
          </label>
          <AppSortMenu v-model="selectedSort" :options="sortOptions" />
        </div>
      </div>

      <div class="mt-8">
        <AppProductGrid :products="products" :layout="isMobile ? 'list' : 'grid'" />
      </div>
    </section>
  </div>
</template>
