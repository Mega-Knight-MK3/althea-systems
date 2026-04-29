<script setup lang="ts">
import type { SortOption } from '~/components/AppSortMenu.vue'

useHead({ title: 'Recherche — Althea Systems' })

const route = useRoute()
const router = useRouter()

const sortOptions: SortOption[] = [
  { value: 'relevance-desc', label: 'Pertinence', sort: 'relevance', order: 'desc' },
  { value: 'priority-desc', label: 'Mis en avant', sort: 'priority', order: 'desc' },
  { value: 'price-asc', label: 'Prix croissant', sort: 'price', order: 'asc' },
  { value: 'price-desc', label: 'Prix décroissant', sort: 'price', order: 'desc' },
  { value: 'date-desc', label: 'Nouveautés', sort: 'date', order: 'desc' },
  { value: 'date-asc', label: 'Plus anciens', sort: 'date', order: 'asc' },
  { value: 'stock-desc', label: 'Stock disponible', sort: 'stock', order: 'desc' },
  { value: 'stock-asc', label: 'Stock faible', sort: 'stock', order: 'asc' },
]

const query = ref(String(route.query.q ?? ''))
const minPrice = ref(route.query.minPrice ? Number(route.query.minPrice) : undefined)
const maxPrice = ref(route.query.maxPrice ? Number(route.query.maxPrice) : undefined)
const categoryId = ref<number | undefined>(
  route.query.categoryId ? Number(route.query.categoryId) : undefined
)
const inStockOnly = ref(route.query.inStockOnly === '1')
const selectedSort = ref(String(route.query.sort ?? 'relevance-desc'))
const page = ref(route.query.page ? Number(route.query.page) : 1)
const PER_PAGE = 24

watch([query, minPrice, maxPrice, categoryId, inStockOnly, selectedSort], () => {
  page.value = 1
})

function changePage(next: number) {
  page.value = next
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

const { data: categoriesResult } = await useCategories()
const categories = computed(() => categoriesResult.value ?? [])

const productParams = computed(() => {
  const option = sortOptions.find((o) => o.value === selectedSort.value) ?? sortOptions[0]!
  return {
    q: query.value || undefined,
    categoryId: categoryId.value,
    minPrice: minPrice.value,
    maxPrice: maxPrice.value,
    inStockOnly: inStockOnly.value || undefined,
    sort: option.sort,
    order: option.order,
    perPage: PER_PAGE,
    page: page.value,
  }
})

const { data: productsResult, status } = await useProducts(productParams)
const products = computed(() => productsResult.value?.data ?? [])

watchDebounced(
  productParams,
  () => {
    router.replace({
      query: {
        q: query.value || undefined,
        categoryId: categoryId.value,
        minPrice: minPrice.value,
        maxPrice: maxPrice.value,
        inStockOnly: inStockOnly.value ? '1' : undefined,
        sort: selectedSort.value,
        page: page.value > 1 ? page.value : undefined,
      },
    })
  },
  { debounce: 250 }
)

function watchDebounced<T>(
  source: ComputedRef<T>,
  callback: () => void,
  options: { debounce: number }
) {
  let handle: ReturnType<typeof setTimeout> | null = null
  watch(source, () => {
    if (handle) clearTimeout(handle)
    handle = setTimeout(callback, options.debounce)
  })
}

function clearFilters() {
  query.value = ''
  minPrice.value = undefined
  maxPrice.value = undefined
  categoryId.value = undefined
  inStockOnly.value = false
  selectedSort.value = 'relevance-desc'
}
</script>

<template>
  <section class="mx-auto w-full max-w-[1440px] px-4 py-10 md:px-10 md:py-14">
    <header>
      <h1 class="font-display text-h1 font-medium text-brand-text">Recherche avancée</h1>
      <p class="mt-3 max-w-2xl text-body-lg text-neutral-700">
        Affinez votre recherche par texte, catégorie, prix et disponibilité.
      </p>
    </header>

    <div class="mt-10 grid gap-10 md:grid-cols-[280px_1fr]">
      <aside class="space-y-6 rounded-xl border border-neutral-100 bg-white p-6">
        <div>
          <label class="text-caption text-neutral-500 uppercase tracking-wide">Mot-clé</label>
          <input
            v-model="query"
            type="search"
            placeholder="Stéthoscope, otoscope..."
            class="bg-neutral-50 mt-2 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="text-caption text-neutral-500 uppercase tracking-wide">Catégorie</label>
          <select
            v-model.number="categoryId"
            class="mt-2 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option :value="undefined">Toutes les catégories</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="text-caption text-neutral-500 uppercase tracking-wide">Prix</label>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <input
              v-model.number="minPrice"
              type="number"
              min="0"
              placeholder="Min"
              class="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <input
              v-model.number="maxPrice"
              type="number"
              min="0"
              placeholder="Max"
              class="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <label class="inline-flex items-center gap-2 text-sm text-neutral-700">
          <input
            v-model="inStockOnly"
            type="checkbox"
            class="accent-brand-500 h-4 w-4 rounded border-neutral-300"
          />
          Uniquement en stock
        </label>

        <button
          type="button"
          class="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition-colors hover:border-brand-500 hover:text-brand-500"
          @click="clearFilters"
        >
          Réinitialiser
        </button>
      </aside>

      <div>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <p class="text-sm text-neutral-600">
            <span v-if="status === 'pending'">Recherche en cours…</span>
            <span v-else>
              {{ productsResult?.meta?.total ?? 0 }} résultat{{
                (productsResult?.meta?.total ?? 0) > 1 ? 's' : ''
              }}
            </span>
          </p>
          <AppSortMenu v-model="selectedSort" :options="sortOptions" />
        </div>

        <div class="mt-6">
          <AppProductGrid
            :products="products"
            empty-message="Aucun produit ne correspond à vos critères."
          />
        </div>

        <div v-if="productsResult?.meta && productsResult.meta.lastPage > 1" class="mt-8">
          <AppPagination
            :current-page="productsResult.meta.currentPage"
            :last-page="productsResult.meta.lastPage"
            :total="productsResult.meta.total"
            :per-page="productsResult.meta.perPage"
            @update:page="changePage"
          />
        </div>
      </div>
    </div>
  </section>
</template>
