export default defineNuxtRouteMiddleware((to, from) => {
  // Перенаправляем на страницу списка продуктов при первом визите
  if (from.path === "/" && to.path === "/") {
    return navigateTo("/dashboard");
  }
});
