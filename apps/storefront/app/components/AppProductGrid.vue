<script setup lang="ts">
import type { Product } from '~~/app/types/catalog'

const props = defineProps<{
  products: Product[]
  layout?: 'grid' | 'list'
  emptyMessage?: string
}>()

const layout = computed(() => props.layout ?? 'grid')
const emptyMessage = computed(() => props.emptyMessage ?? 'Aucun produit pour le moment.')
</script>

<template>
  <div v-if="!products.length" class="rounded-xl border border-neutral-100 p-8 text-center">
    <p class="text-sm text-neutral-500">{{ emptyMessage }}</p>
  </div>
  <ul
    v-else-if="layout === 'list'"
    class="flex flex-col gap-3"
  >
    <li v-for="product in products" :key="product.id">
      <AppProductCard :product="product" layout="list" />
    </li>
  </ul>
  <ul
    v-else
    class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4"
  >
    <li v-for="product in products" :key="product.id">
      <AppProductCard :product="product" />
    </li>
  </ul>
</template>
