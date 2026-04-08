<script setup lang="ts">
const router = useRouter()
const query = ref('')

function onSubmit() {
  const trimmed = query.value.trim()
  if (!trimmed) return
  router.push({ path: '/search', query: { q: trimmed } })
}
</script>

<template>
  <form
    class="flex w-full items-center justify-between gap-3 rounded-lg border-2 border-neutral-600 bg-neutral-50 px-6 py-4"
    role="search"
    @submit.prevent="onSubmit"
  >
    <input
      v-model="query"
      type="search"
      name="q"
      placeholder="Rechercher un produit, une catégorie"
      class="w-full bg-transparent text-base text-neutral-800 placeholder:text-neutral-600 focus:outline-none"
      aria-label="Rechercher un produit ou une catégorie"
    />
    <button
      type="submit"
      class="text-neutral-600 transition-colors hover:text-brand-500"
      aria-label="Lancer la recherche"
    >
      <svg
        viewBox="0 0 24 24"
        class="h-6 w-6"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" stroke-linecap="round" />
      </svg>
    </button>
  </form>
</template>
