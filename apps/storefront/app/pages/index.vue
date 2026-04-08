<script setup lang="ts">
useHead({ title: 'Althea Systems — matériel médical' })

const { data: homepage } = await useHomepageConfig()
const { data: categoriesResult } = await useCategories()
const { data: featured } = await useProducts(() => ({ sort: 'priority', perPage: 8 }))

const categories = computed(() => categoriesResult.value ?? [])
const featuredProducts = computed(() => featured.value?.data ?? [])
</script>

<template>
  <div>
    <AppHeroCarousel v-if="homepage" :slides="homepage.carousel.slides" />
    <AppIntroSection v-if="homepage" :intro="homepage.intro" />
    <AppCategoryGrid :categories="categories" />
    <AppFeaturedProducts :products="featuredProducts" />
  </div>
</template>
