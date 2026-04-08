<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: product } = await useProduct(slug)

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
}

useHead(() => ({ title: `${product.value?.name ?? 'Produit'} — Althea Systems` }))

const { data: similar } = await useSimilarProducts(slug)
const { data: imagesResult } = await useProductImages(slug)

const images = computed(() => imagesResult.value ?? [])
const similarProducts = computed(() => similar.value ?? [])
const activeImageIndex = ref(0)
const inStock = computed(() => (product.value?.stock ?? 0) > 0)
const formattedPrice = computed(() =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
    product.value?.price ?? 0
  )
)
</script>

<template>
  <article class="mx-auto w-full max-w-[1440px] px-4 py-10 md:px-10 md:py-14">
    <nav class="text-caption mb-6 text-neutral-500">
      <NuxtLink to="/" class="hover:text-brand-500">Accueil</NuxtLink>
      <span class="mx-2">/</span>
      <NuxtLink
        v-if="product?.category"
        :to="`/categories/${product.category.slug}`"
        class="hover:text-brand-500"
      >
        {{ product.category.name }}
      </NuxtLink>
      <span v-if="product?.category" class="mx-2">/</span>
      <span class="text-brand-text">{{ product?.name }}</span>
    </nav>

    <div class="grid gap-10 md:grid-cols-2">
      <div>
        <div
          class="bg-brand-50 flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl"
        >
          <img
            v-if="images[activeImageIndex]"
            :src="productImageUrl(images[activeImageIndex]!.id)"
            :alt="images[activeImageIndex]!.metadata?.alt ?? product?.name"
            class="h-full w-full object-cover"
          />
          <div
            v-else
            class="font-display text-brand-500 text-sm tracking-widest uppercase"
          >
            Visuel à venir
          </div>
        </div>
        <ul v-if="images.length > 1" class="mt-4 grid grid-cols-5 gap-3">
          <li v-for="(image, index) in images" :key="image.id">
            <button
              type="button"
              class="aspect-square w-full overflow-hidden rounded-lg border-2 transition-colors"
              :class="
                index === activeImageIndex
                  ? 'border-brand-500'
                  : 'border-neutral-100 hover:border-brand-300'
              "
              :aria-label="`Voir l'image ${index + 1}`"
              @click="activeImageIndex = index"
            >
              <img
                :src="productImageUrl(image.id)"
                :alt="image.metadata?.alt ?? `${product?.name} ${index + 1}`"
                class="h-full w-full object-cover"
              />
            </button>
          </li>
        </ul>
      </div>

      <div>
        <h1 class="font-display text-h1 font-medium text-brand-text">{{ product?.name }}</h1>
        <p class="text-price font-display text-brand-500 mt-4">{{ formattedPrice }}</p>

        <p class="mt-3">
          <span
            v-if="!inStock"
            class="bg-danger/10 text-danger inline-flex rounded-full px-3 py-1 text-sm"
          >
            En rupture de stock
          </span>
          <span
            v-else
            class="bg-success/10 text-success inline-flex rounded-full px-3 py-1 text-sm"
          >
            En stock
          </span>
        </p>

        <p v-if="product?.description" class="mt-6 max-w-xl text-body-lg text-neutral-700">
          {{ product.description }}
        </p>

        <button
          type="button"
          class="bg-brand-500 hover:bg-brand-700 mt-8 inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300"
          :disabled="!inStock"
        >
          {{ inStock ? 'Ajouter au panier' : 'En rupture de stock' }}
        </button>
      </div>
    </div>

    <section v-if="similarProducts.length" class="mt-16">
      <h2 class="font-display text-h2 font-medium text-brand-text">Produits similaires</h2>
      <div class="mt-6">
        <AppProductGrid :products="similarProducts" />
      </div>
    </section>
  </article>
</template>
