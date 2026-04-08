export function useMediaQuery(query: string = '(max-width: 767px)') {
  const matches = ref(false)

  if (import.meta.client) {
    const media = window.matchMedia(query)
    matches.value = media.matches
    const handler = (event: MediaQueryListEvent) => {
      matches.value = event.matches
    }
    media.addEventListener('change', handler)
    onScopeDispose(() => media.removeEventListener('change', handler))
  }

  return matches
}
