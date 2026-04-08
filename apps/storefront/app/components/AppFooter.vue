<script setup lang="ts">
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
</script>

<template>
  <footer class="hidden border-t border-neutral-100 bg-brand-text text-neutral-50 md:block">
    <div
      class="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-10 py-10 md:flex-row md:items-center md:justify-between"
    >
      <p class="font-display text-sm tracking-wide">
        © {{ new Date().getFullYear() }} Althea Systems
      </p>

      <nav aria-label="Liens légaux" class="flex flex-wrap items-center gap-6 text-sm">
        <NuxtLink
          v-for="link in legalLinks"
          :key="link.to"
          :to="link.to"
          class="transition-colors hover:text-brand-50"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <ul class="flex items-center gap-4 text-sm">
        <li v-for="link in socialLinks" :key="link.href">
          <a
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="transition-colors hover:text-brand-50"
          >
            {{ link.label }}
          </a>
        </li>
      </ul>
    </div>
  </footer>
</template>
