<script setup lang="ts">
import type { Product } from '~~/app/types/catalog'

const props = defineProps<{ product: Product; layout?: 'grid' | 'list' }>()

const layout = computed(() => props.layout ?? 'grid')
const inStock = computed(() => props.product.stock > 0)
const isLowStock = computed(() => props.product.stock > 0 && props.product.stock <= 5)
const formattedPrice = computed(() =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(props.product.price)
)
</script>

<template>
  <NuxtLink
    :to="`/products/${product.slug}`"
    class="group block overflow-hidden rounded-xl border border-neutral-100 bg-white transition-shadow hover:shadow-md"
    :class="layout === 'list' ? 'flex gap-4 p-3' : ''"
  >
    <div
      class="bg-brand-50 overflow-hidden"
      :class="layout === 'list' ? 'h-24 w-24 shrink-0 rounded-lg' : 'aspect-square w-full'"
    >
      <div
        class="text-brand-500 flex h-full w-full items-center justify-center font-display text-xs tracking-widest uppercase"
      >
        {{ product.name.charAt(0) }}
      </div>
    </div>

    <div class="flex-1 p-4" :class="layout === 'list' ? 'p-0' : ''">
      <h3 class="font-display text-base font-medium text-brand-text line-clamp-2">
        {{ product.name }}
      </h3>
      <p class="text-price font-display text-brand-500 mt-2">{{ formattedPrice }}</p>

      <p class="mt-2 text-caption">
        <span v-if="!inStock" class="rounded-full bg-danger/10 px-2 py-0.5 text-danger">
          En rupture de stock
        </span>
        <span v-else-if="isLowStock" class="rounded-full bg-warning/10 px-2 py-0.5 text-warning">
          Stock faible
        </span>
        <span v-else class="rounded-full bg-success/10 px-2 py-0.5 text-success">En stock</span>
      </p>
    </div>
  </NuxtLink>
</template>
