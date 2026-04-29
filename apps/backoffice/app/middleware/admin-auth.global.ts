export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAdminAuth()
  const isPublic = to.path === '/login'

  if (!isAuthenticated.value && !isPublic) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
  if (isAuthenticated.value && isPublic) {
    return navigateTo('/')
  }
})
