<script setup lang="ts">
useHead({ title: 'Catégories — Althea Systems' })

const { data: categoriesResult } = await useCategories()
const categories = computed(() => categoriesResult.value ?? [])
</script>

<template>
  <section class="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-10 md:py-16">
    <h1 class="font-display text-h1 font-medium text-brand-text">Toutes nos catégories</h1>
    <p class="mt-3 max-w-2xl text-body-lg text-neutral-700">
      Parcourez l’ensemble des familles de produits proposées par Althea Systems.
    </p>

    <ul
      v-if="categories.length"
      class="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4"
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
            <h2 class="font-display text-base font-medium text-brand-text">{{ category.name }}</h2>
            <p v-if="category.description" class="mt-1 line-clamp-2 text-sm text-neutral-600">
              {{ category.description }}
            </p>
          </div>
        </NuxtLink>
      </li>
    </ul>

    <p v-else class="mt-10 text-sm text-neutral-500">Aucune catégorie pour le moment.</p>
  </section>
</template>
