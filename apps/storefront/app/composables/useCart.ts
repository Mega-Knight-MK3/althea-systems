const itemCount = ref(0)

export function useCart() {
  const isEmpty = computed(() => itemCount.value === 0)

  function setCount(next: number) {
    itemCount.value = next
  }

  return {
    itemCount,
    isEmpty,
    setCount,
  }
}
