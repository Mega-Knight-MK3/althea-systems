<script setup lang="ts">
import type { HomepageConfig } from '~~/app/types/catalog'

const { t } = useI18n()
defineProps<{ intro: HomepageConfig['intro'] }>()

const stats = [
  { id: 'expertise', value: '15', labelKey: 'home.stat_expertise' },
  { id: 'cabinets', value: '2000+', labelKey: 'home.stat_cabinets' },
  { id: 'sav', value: '48h', labelKey: 'home.stat_sav' }
]
</script>

<template>
  <section class="bg-white py-12 md:py-16">
    <div class="mx-auto w-full max-w-[1440px] px-4 md:px-10">
      <p class="text-body-lg max-w-3xl text-neutral-700">{{ intro.body }}</p>
      <dl class="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div
          v-for="stat in stats"
          :key="stat.id"
          class="rounded-xl border border-neutral-100 p-6"
        >
          <dt class="text-caption text-neutral-500 uppercase">{{ t(stat.labelKey) }}</dt>
          <dd class="font-display text-h1 mt-2 font-medium text-brand-500">{{ stat.value }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
