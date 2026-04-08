<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { isAuthenticated, logout } = useAuth()

const primaryLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Catégories', to: '/categories' },
  { label: 'Recherche', to: '/search' },
  { label: 'Contact', to: '/contact' },
]

const guestLinks = [
  { label: 'Se connecter', to: '/login' },
  { label: 'Créer un compte', to: '/register' },
]

const accountLinks = [
  { label: 'Mon compte', to: '/account' },
  { label: 'Mes commandes', to: '/account/orders' },
]

const legalLinks = [
  { label: 'CGU', to: '/cgu' },
  { label: 'Mentions légales', to: '/mentions-legales' },
  { label: 'Contact', to: '/contact' },
]

const socialLinks = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { label: 'Facebook', href: 'https://www.facebook.com/' },
  { label: 'Twitter', href: 'https://twitter.com/' },
]

function close() {
  emit('close')
}

function onLogout() {
  logout()
  close()
}

watch(
  () => props.open,
  (isOpen) => {
    if (import.meta.client) {
      document.documentElement.style.overflow = isOpen ? 'hidden' : ''
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 bg-neutral-900/50" @click="close" />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-300"
      leave-active-class="transition-transform duration-300"
      enter-from-class="translate-x-full"
      leave-to-class="translate-x-full"
    >
      <aside
        v-if="open"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-[584px] flex-col overflow-y-auto bg-white px-8 py-12 md:px-[52px] md:py-[62px]"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        <button
          type="button"
          class="self-end text-neutral-700 transition-colors hover:text-brand-500"
          aria-label="Fermer le menu"
          @click="close"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-7 w-7"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </button>

        <nav
          aria-label="Navigation principale"
          class="mt-8 flex flex-col gap-7 font-display text-2xl font-medium tracking-wide text-neutral-900 md:text-[32px]"
        >
          <NuxtLink
            v-for="link in primaryLinks"
            :key="link.to"
            :to="link.to"
            class="transition-colors hover:text-brand-500"
            @click="close"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <hr class="my-8 border-neutral-100" />

        <nav
          v-if="isAuthenticated"
          aria-label="Compte"
          class="flex flex-col gap-4 font-sans text-base text-neutral-700"
        >
          <NuxtLink
            v-for="link in accountLinks"
            :key="link.to"
            :to="link.to"
            class="transition-colors hover:text-brand-500"
            @click="close"
          >
            {{ link.label }}
          </NuxtLink>
          <button
            type="button"
            class="text-left transition-colors hover:text-brand-500"
            @click="onLogout"
          >
            Se déconnecter
          </button>
        </nav>

        <nav
          v-else
          aria-label="Compte"
          class="flex flex-col gap-4 font-sans text-base text-neutral-700"
        >
          <NuxtLink
            v-for="link in guestLinks"
            :key="link.to"
            :to="link.to"
            class="transition-colors hover:text-brand-500"
            @click="close"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <hr class="my-8 border-neutral-100 md:hidden" />

        <div class="md:hidden">
          <nav aria-label="Liens légaux" class="flex flex-col gap-3 text-sm text-neutral-600">
            <NuxtLink
              v-for="link in legalLinks"
              :key="link.to"
              :to="link.to"
              class="transition-colors hover:text-brand-500"
              @click="close"
            >
              {{ link.label }}
            </NuxtLink>
          </nav>

          <ul class="mt-4 flex flex-wrap gap-4 text-sm text-neutral-600">
            <li v-for="link in socialLinks" :key="link.href">
              <a
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="transition-colors hover:text-brand-500"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
