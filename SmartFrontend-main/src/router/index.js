import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    redirect: (to) => {
      // Check if user is admin and redirect accordingly
      const authStore = useAuthStore()
      if (authStore.isAuthenticated && authStore.user?.roles?.includes('ROLE_ADMIN')) {
        return '/admin'
      }
      return '/dashboard'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/AdminDashboardHome.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/products',
    name: 'AdminProducts',
    component: () => import('@/views/AdminProductsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: () => import('@/views/AdminOrdersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/customers',
    name: 'AdminCustomers',
    component: () => import('@/views/AdminCustomersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  {
    path: '/admin/low-stock',
    name: 'AdminLowStock',
    component: () => import('@/views/AdminLowStockView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: () => import('@/features/products/views/ProductDetailView.vue'),
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('@/views/CheckoutView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('@/views/ForbiddenView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Preload critical routes for better performance
router.beforeResolve((to, from, next) => {
  // Preload the component if it's not already loaded
  if (to.matched.some(record => record.components)) {
    const components = to.matched
      .map(record => record.components.default)
      .filter(component => typeof component === 'function')
    
    Promise.all(components.map(component => component()))
      .then(() => next())
      .catch(() => next())
  } else {
    next()
  }
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Not authenticated, redirect to login
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    
    // Check if route requires admin role
    if (to.meta.requiresAdmin) {
      const user = authStore.user
      if (!user || !user.roles || !user.roles.includes('ROLE_ADMIN')) {
        // Not admin, show 403 error
        next({ name: 'Forbidden' })
        return
      }
    }
  }
  
  // If user is authenticated and trying to access login/register, redirect to dashboard
  if (authStore.isAuthenticated && (to.name === 'Login' || to.name === 'Register')) {
    next({ name: 'Dashboard' })
    return
  }
  
  next()
})

export default router
