<script setup lang="ts">
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js'
import { Bar, Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, BarElement)

interface SalesPayload {
  range: '7d' | '5w'
  bucketLabels: string[]
  totals: number[]
  byCategory: Array<{ name: string, total: number }>
  stackedByCategory: Array<{ name: string, values: number[] }>
}

const PALETTE = [
  '#16a34a', '#2563eb', '#f97316', '#a855f7', '#0ea5e9',
  '#dc2626', '#facc15', '#14b8a6', '#ec4899', '#64748b'
]

const api = useApi()
const range = ref<'7d' | '5w'>('7d')

const { data, pending, refresh } = await useAsyncData<SalesPayload>(
  'admin-sales',
  () => api<SalesPayload>('/admin/dashboard/sales', { params: { range: range.value } }),
  { watch: [range] }
)

const colorFor = (i: number) => PALETTE[i % PALETTE.length]

const pieData = computed(() => ({
  labels: data.value?.byCategory.map((c) => c.name) ?? [],
  datasets: [
    {
      data: data.value?.byCategory.map((c) => c.total) ?? [],
      backgroundColor: (data.value?.byCategory ?? []).map((_, i) => colorFor(i)),
      borderWidth: 0
    }
  ]
}))

const totalsData = computed(() => ({
  labels: data.value?.bucketLabels ?? [],
  datasets: [
    {
      label: 'Ventes',
      data: data.value?.totals ?? [],
      backgroundColor: '#16a34a',
      borderRadius: 6
    }
  ]
}))

const stackedData = computed(() => ({
  labels: data.value?.bucketLabels ?? [],
  datasets:
    data.value?.stackedByCategory.map((series, i) => ({
      label: series.name,
      data: series.values,
      backgroundColor: colorFor(i),
      borderRadius: 4,
      stack: 'sales'
    })) ?? []
}))

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { beginAtZero: true } },
  plugins: { legend: { display: false } }
}

const stackedOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
  plugins: { legend: { position: 'bottom' as const } }
}

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } }
}

const hasData = computed(() => (data.value?.totals ?? []).some((v) => v > 0))
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold">Analyse des ventes</h2>
          <p class="text-sm text-muted">{{ range === '7d' ? '7 derniers jours' : '5 dernières semaines' }}</p>
        </div>
        <div class="flex items-center gap-2">
          <UTabs
            v-model="range"
            :items="[
              { label: '7 jours', value: '7d' },
              { label: '5 semaines', value: '5w' }
            ]"
            size="sm"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            color="neutral"
            :loading="pending"
            aria-label="Rafraîchir"
            @click="refresh()"
          />
        </div>
      </div>
    </template>

    <div v-if="!hasData" class="py-12 text-center text-sm text-muted">
      Aucune vente sur la période sélectionnée.
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-1">
        <h3 class="text-sm font-medium mb-2">Répartition par catégorie</h3>
        <div class="h-64">
          <Doughnut :data="pieData" :options="pieOptions" />
        </div>
      </div>
      <div class="lg:col-span-2">
        <h3 class="text-sm font-medium mb-2">Ventes par période</h3>
        <div class="h-64">
          <Bar :data="totalsData" :options="barOptions" />
        </div>
      </div>
      <div class="lg:col-span-3">
        <h3 class="text-sm font-medium mb-2">Décomposition par catégorie</h3>
        <div class="h-72">
          <Bar :data="stackedData" :options="stackedOptions" />
        </div>
      </div>
    </div>
  </UCard>
</template>
