<script setup lang="ts">
import type { HomepageConfig } from '~~/app/types/catalog'

const props = defineProps<{ slides: HomepageConfig['carousel']['slides'] }>()

const activeIndex = ref(0)
const slideCount = computed(() => props.slides.length)

let timer: ReturnType<typeof setInterval> | null = null

function start() {
  stop()
  if (slideCount.value <= 1) return
  timer = setInterval(next, 6000)
}

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

function goTo(index: number) {
  activeIndex.value = (index + slideCount.value) % slideCount.value
  start()
}

function next() {
  goTo(activeIndex.value + 1)
}

function previous() {
  goTo(activeIndex.value - 1)
}

onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <section
    v-if="slides.length"
    class="relative overflow-hidden bg-brand-50"
    aria-roledescription="carousel"
    @mouseenter="stop"
    @mouseleave="start"
  >
    <div class="mx-auto flex w-full max-w-[1440px] items-center px-4 py-12 md:px-10 md:py-20">
      <div class="relative w-full">
        <transition
          enter-active-class="transition-opacity duration-500"
          leave-active-class="transition-opacity duration-500"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
          mode="out-in"
        >
          <article :key="slides[activeIndex]!.id" class="grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <p
                class="font-sans text-caption tracking-widest text-brand-500 uppercase"
              >
                {{ slides[activeIndex]!.eyebrow }}
              </p>
              <h2
                class="font-display text-h2 mt-3 max-w-xl font-medium text-brand-text md:text-h1"
              >
                {{ slides[activeIndex]!.title }}
              </h2>
              <p class="mt-4 max-w-xl text-body-lg text-neutral-700">
                {{ slides[activeIndex]!.body }}
              </p>
              <NuxtLink
                :to="slides[activeIndex]!.ctaUrl"
                class="bg-brand-500 hover:bg-brand-700 mt-8 inline-flex items-center rounded-md px-5 py-3 text-sm font-medium text-white transition-colors"
              >
                {{ slides[activeIndex]!.ctaLabel }}
              </NuxtLink>
            </div>
            <div
              class="bg-brand-300/20 hidden aspect-[4/3] w-full items-center justify-center rounded-2xl md:flex"
            >
              <img
                v-if="slides[activeIndex]!.imageUrl"
                :src="slides[activeIndex]!.imageUrl"
                :alt="slides[activeIndex]!.title"
                class="h-full w-full rounded-2xl object-cover"
              />
              <span v-else class="font-display text-brand-500 text-sm tracking-widest uppercase">
                Visuel à venir
              </span>
            </div>
          </article>
        </transition>
      </div>
    </div>

    <div class="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
      <button
        v-for="(slide, index) in slides"
        :key="slide.id"
        type="button"
        class="h-2 rounded-full transition-all"
        :class="
          index === activeIndex
            ? 'w-8 bg-brand-500'
            : 'w-2 bg-brand-500/30 hover:bg-brand-500/60'
        "
        :aria-label="`Aller à la diapositive ${index + 1}`"
        @click="goTo(index)"
      />
    </div>

    <button
      type="button"
      class="absolute top-1/2 left-4 hidden -translate-y-1/2 rounded-full bg-white p-2 text-neutral-700 shadow transition-colors hover:text-brand-500 md:block"
      aria-label="Précédent"
      @click="previous"
    >
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="m15 6-6 6 6 6" />
      </svg>
    </button>

    <button
      type="button"
      class="absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-full bg-white p-2 text-neutral-700 shadow transition-colors hover:text-brand-500 md:block"
      aria-label="Suivant"
      @click="next"
    >
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </button>
  </section>
</template>
