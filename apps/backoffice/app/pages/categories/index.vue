<script setup lang="ts">
import type { AdminCategory } from '~/composables/useApiTypes'

const api = useApi()
const toast = useToast()

const { data, refresh, pending } = await useAsyncData<AdminCategory[]>('admin-categories-list', () =>
  api<AdminCategory[]>('/admin/categories')
)

const selected = ref<Set<number>>(new Set())

interface Node extends AdminCategory {
  children: Node[]
  depth: number
}

const tree = computed(() => buildTree(data.value ?? []))
const flat = computed(() => flatten(tree.value))

function buildTree(items: AdminCategory[]): Node[] {
  const map = new Map<number, Node>()
  items.forEach((c) => map.set(c.id, { ...c, children: [], depth: 0 }))
  const roots: Node[] = []
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      const parent = map.get(node.parentId)!
      node.depth = parent.depth + 1
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }
  for (const node of map.values()) node.children.sort((a, b) => a.position - b.position)
  roots.sort((a, b) => a.position - b.position)
  return roots
}

function flatten(nodes: Node[], depth = 0, acc: Node[] = []): Node[] {
  for (const node of nodes) {
    acc.push({ ...node, depth })
    flatten(node.children, depth + 1, acc)
  }
  return acc
}

function toggleSelect(id: number) {
  const copy = new Set(selected.value)
  if (copy.has(id)) copy.delete(id); else copy.add(id)
  selected.value = copy
}

function clearSelection() { selected.value = new Set() }

async function destroy(category: AdminCategory) {
  if (!confirm(`Supprimer la catégorie « ${category.name} » ?`)) return
  await api(`/admin/categories/${category.id}`, { method: 'DELETE' })
  toast.add({ color: 'success', title: 'Catégorie supprimée.' })
  refresh()
}

async function move(category: Node, direction: -1 | 1) {
  const siblings = (category.parentId
    ? data.value?.find((c) => c.id === category.parentId) && flat.value.filter((n) => n.parentId === category.parentId)
    : flat.value.filter((n) => n.parentId === null)) || []
  const sorted = [...siblings].sort((a, b) => a.position - b.position)
  const idx = sorted.findIndex((c) => c.id === category.id)
  const swapIdx = idx + direction
  if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return
  const a = sorted[idx]
  const b = sorted[swapIdx]
  if (!a || !b) return
  const items = [
    { id: a.id, position: b.position },
    { id: b.id, position: a.position }
  ]
  await api('/admin/categories/reorder', { method: 'POST', body: { items } })
  refresh()
}

async function bulkSetStatus(isActive: boolean) {
  if (!selected.value.size) return
  await api('/admin/categories/bulk-status', {
    method: 'POST',
    body: { ids: [...selected.value], isActive }
  })
  toast.add({ color: 'success', title: `${selected.value.size} catégorie(s) ${isActive ? 'activée(s)' : 'désactivée(s)'}.` })
  clearSelection()
  refresh()
}
</script>

<template>
  <UDashboardNavbar title="Catégories">
    <template #right>
      <UButton to="/categories/new" icon="i-lucide-plus" label="Nouvelle catégorie" />
    </template>
  </UDashboardNavbar>
  <div class="flex flex-col gap-4 sm:gap-6 flex-1 overflow-y-auto p-4 sm:p-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-muted">{{ data?.length ?? 0 }} catégorie(s)</p>
          <div class="flex items-center gap-2">
            <UButton
              v-if="selected.size"
              icon="i-lucide-eye"
              color="primary"
              variant="soft"
              size="sm"
              :label="`Activer (${selected.size})`"
              @click="bulkSetStatus(true)"
            />
            <UButton
              v-if="selected.size"
              icon="i-lucide-eye-off"
              color="warning"
              variant="soft"
              size="sm"
              :label="`Désactiver (${selected.size})`"
              @click="bulkSetStatus(false)"
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

      <div v-if="!flat.length" class="py-12 text-center text-sm text-muted">
        Aucune catégorie. Créez la première via le bouton en haut à droite.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="text-left text-muted uppercase text-xs">
            <tr>
              <th class="px-3 py-2 w-10"></th>
              <th class="px-3 py-2">Nom</th>
              <th class="px-3 py-2">Description</th>
              <th class="px-3 py-2 text-right">Produits</th>
              <th class="px-3 py-2 text-right">Position</th>
              <th class="px-3 py-2">Statut</th>
              <th class="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="category in flat" :key="category.id">
              <td class="px-3 py-3">
                <UCheckbox :model-value="selected.has(category.id)" @update:model-value="toggleSelect(category.id)" />
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-2" :style="{ paddingLeft: `${category.depth * 16}px` }">
                  <UIcon v-if="category.depth > 0" name="i-lucide-corner-down-right" class="text-muted size-4" />
                  <span class="font-medium">{{ category.name }}</span>
                  <span class="text-xs text-muted">/{{ category.slug }}</span>
                </div>
              </td>
              <td class="px-3 py-3 text-muted text-xs max-w-md">
                <span class="line-clamp-1">{{ category.description || '—' }}</span>
              </td>
              <td class="px-3 py-3 text-right">{{ category.productCount ?? 0 }}</td>
              <td class="px-3 py-3 text-right">
                <div class="inline-flex items-center gap-1">
                  <UButton icon="i-lucide-arrow-up" size="xs" variant="ghost" color="neutral" aria-label="Monter" @click="move(category, -1)" />
                  <span>{{ category.position }}</span>
                  <UButton icon="i-lucide-arrow-down" size="xs" variant="ghost" color="neutral" aria-label="Descendre" @click="move(category, 1)" />
                </div>
              </td>
              <td class="px-3 py-3">
                <UBadge :color="category.isActive ? 'success' : 'warning'" variant="subtle">
                  {{ category.isActive ? 'Active' : 'Désactivée' }}
                </UBadge>
              </td>
              <td class="px-3 py-3 text-right">
                <div class="flex justify-end gap-1">
                  <UButton :to="`/categories/${category.id}`" icon="i-lucide-pencil" variant="ghost" color="neutral" size="sm" aria-label="Éditer" />
                  <UButton icon="i-lucide-trash-2" variant="ghost" color="error" size="sm" aria-label="Supprimer" @click="destroy(category)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
