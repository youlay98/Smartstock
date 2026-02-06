import 'bootstrap/dist/css/bootstrap.min.css'
import './assets/main.css'
import './styles/tokens/design-tokens.scss'
import { createApp } from 'vue'
import App from './App.vue'
import VueLazyload from 'vue-lazyload'

import router from './router'
import pinia from './stores'
import i18n from './i18n'
import { setupInterceptors, setupResponseInterceptors } from './services/api'
import { checkBackendStatus, showBackendStatusNotification } from './services/backendStatus'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Initialize API interceptors
setupInterceptors()
setupResponseInterceptors()

const app = createApp(App)

// Configure VueLazyload
app.use(VueLazyload, {
  preLoad: 1.3,
  attempt: 1,
  cache: true
})

// Toast configuration
const toastOptions = {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
}

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(Toast, toastOptions)

// Check backend status and initialize cart on app startup
checkBackendStatus().then(isAvailable => {
  showBackendStatusNotification(isAvailable)
  
  // If backend is available and user is authenticated, refresh cart
  if (isAvailable) {
    const token = localStorage.getItem('token')
    if (token) {
      // Import and use cart store to refresh prices
      import('./stores/cart').then(({ useCartStore }) => {
        const cartStore = useCartStore()
        cartStore.loadCart().catch(error => {
          console.warn('Failed to load cart on startup:', error)
        })
      })
    }
  }
})

app.mount('#app')
