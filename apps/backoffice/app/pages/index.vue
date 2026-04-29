<script setup lang="ts">
const { user } = useAdminAuth()
</script>

<template>
  <UDashboardNavbar title="Tableau de bord" />
  <UDashboardPanelContent>
    <div class="space-y-6">
      <UCard>
        <template #header>
          <div>
            <p class="text-sm text-muted">Bienvenue</p>
            <h1 class="text-xl font-semibold">{{ user?.fullName || user?.email }}</h1>
          </div>
        </template>
        <p class="text-sm text-muted">
          Le tableau de bord détaillé arrivera avec les KPI, les graphes de ventes et les actions rapides.
        </p>
      </UCard>
    </div>
  </UDashboardPanelContent>
</template>
