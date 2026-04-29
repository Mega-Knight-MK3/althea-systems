<script setup lang="ts">
import type { Product } from '~~/app/types/catalog'

const { t } = useI18n()
defineProps<{ products: Product[] }>()
</script>

<template>
  <section class="bg-white py-12 md:py-16">
    <div class="mx-auto w-full max-w-[1440px] px-4 md:px-10">
      <header class="flex items-end justify-between">
        <h2 class="font-display text-h2 font-medium text-brand-text">
          {{ t('home.featured_title') }}
        </h2>
      </header>

      <ul
        v-if="products.length"
        class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4"
      >
        <li v-for="product in products" :key="product.id">
          <AppProductCard :product="product" />
        </li>
      </ul>

      <p v-else class="mt-8 text-sm text-neutral-500">
        {{ t('home.featured_empty') }}
      </p>
    </div>
  </section>
</template>
