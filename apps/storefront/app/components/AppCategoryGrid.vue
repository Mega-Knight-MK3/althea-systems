<script setup lang="ts">
import type { Category } from '~~/app/types/catalog'

const { t } = useI18n()
defineProps<{ categories: Category[] }>()
</script>

<template>
  <section class="bg-neutral-50 py-12 md:py-16">
    <div class="mx-auto w-full max-w-[1440px] px-4 md:px-10">
      <header class="flex items-end justify-between">
        <h2 class="font-display text-h2 font-medium text-brand-text">{{ t('home.categories_title') }}</h2>
        <NuxtLink to="/categories" class="text-sm text-brand-500 hover:text-brand-700">
          {{ t('home.categories_view_all') }}
        </NuxtLink>
      </header>

      <ul
        v-if="categories.length"
        class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4"
      >
        <li v-for="category in categories" :key="category.id">
          <NuxtLink
            :to="`/categories/${category.slug}`"
            class="group block overflow-hidden rounded-xl border border-neutral-100 bg-white transition-shadow hover:shadow-md"
          >
            <div class="bg-brand-50 aspect-[4/3] w-full overflow-hidden">
              <img
                v-if="category.imagePath"
                :src="category.imagePath"
                :alt="category.name"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                v-else
                class="text-brand-500 flex h-full w-full items-center justify-center font-display text-sm tracking-widest uppercase"
              >
                {{ category.name.charAt(0) }}
              </div>
            </div>
            <div class="p-4">
              <h3 class="font-display text-base font-medium text-brand-text">{{ category.name }}</h3>
            </div>
          </NuxtLink>
        </li>
      </ul>

      <p v-else class="mt-8 text-sm text-neutral-500">{{ t('home.categories_empty') }}</p>
    </div>
  </section>
</template>
