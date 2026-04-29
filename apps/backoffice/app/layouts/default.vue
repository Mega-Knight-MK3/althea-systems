<script setup lang="ts">
const { user, twoFactorEnabled, clearSession } = useAdminAuth()
const api = useApi()
const router = useRouter()

const navItems = [
  { label: 'Tableau de bord', icon: 'i-lucide-layout-dashboard', to: '/' },
  { label: 'Produits', icon: 'i-lucide-package', to: '/products' },
  { label: 'Catégories', icon: 'i-lucide-folder-tree', to: '/categories' },
  { label: 'Carrousel', icon: 'i-lucide-images', to: '/homepage' },
  { label: 'Commandes', icon: 'i-lucide-shopping-bag', to: '/orders' },
  { label: 'Factures', icon: 'i-lucide-file-text', to: '/invoices' },
  { label: 'Utilisateurs', icon: 'i-lucide-users', to: '/users' },
  { label: 'Sécurité', icon: 'i-lucide-shield-check', to: '/security' }
]

async function logout() {
  try {
    await api('/admin/auth/logout', { method: 'POST' })
  } catch {
    // ignore — clearing local session is enough for ux
  }
  clearSession()
  router.replace('/login')
}
</script>

<template>
  <UApp>
    <UDashboardGroup>
      <UDashboardSidebar collapsible resizable :ui="{ footer: 'border-t border-default' }">
        <template #header="{ collapsed }">
          <NuxtLink to="/" class="flex items-center gap-2 px-2 py-1">
            <UIcon name="i-lucide-stethoscope" class="size-6 text-primary" />
            <span v-if="!collapsed" class="font-semibold">Althea Backoffice</span>
          </NuxtLink>
        </template>

        <template #default="{ collapsed }">
          <UNavigationMenu
            orientation="vertical"
            :items="navItems"
            :collapsed="collapsed"
            class="flex-1"
          />
        </template>

        <template #footer="{ collapsed }">
          <UDropdownMenu
            :items="[
              [{ label: '2FA: ' + (twoFactorEnabled ? 'activée' : 'à configurer'), icon: 'i-lucide-shield', to: '/security' }],
              [{ label: 'Se déconnecter', icon: 'i-lucide-log-out', onSelect: logout }]
            ]"
          >
            <UButton
              :label="collapsed ? '' : (user?.fullName || user?.email || 'Admin')"
              :icon="collapsed ? 'i-lucide-user' : undefined"
              :avatar="collapsed ? undefined : { icon: 'i-lucide-user' }"
              color="neutral"
              variant="ghost"
              block
              :square="collapsed"
            />
          </UDropdownMenu>
        </template>
      </UDashboardSidebar>

      <UDashboardPanel>
        <slot />
      </UDashboardPanel>
    </UDashboardGroup>
  </UApp>
</template>
