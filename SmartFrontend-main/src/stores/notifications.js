import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getNotifications, 
  markNotificationAsRead, 
  getUnreadNotificationCount 
} from '@/services/notificationService'
import { showSuccessToast } from '@/services/api'

export const useNotificationStore = defineStore('notifications', () => {
  // State
  const notifications = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const error = ref(null)
  const filters = ref({
    read: null,
    page: 0,
    size: 20
  })
  const pollingInterval = ref(null)

  // Computed
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.read)
  )

  const readNotifications = computed(() => 
    notifications.value.filter(n => n.read)
  )

  const hasUnread = computed(() => unreadCount.value > 0)

  const lowStockNotifications = computed(() => 
    notifications.value.filter(n => n.type === 'LOW_STOCK' && !n.read)
  )

  const criticalStockNotifications = computed(() => 
    notifications.value.filter(n => n.type === 'LOW_STOCK' && n.currentStock <= 2 && !n.read)
  )

  // Actions
  async function loadNotifications() {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await getNotifications(filters.value.read, filters.value.page, filters.value.size)
      notifications.value = response.data.content || response.data || []
    } catch (err) {
      // Check if it's a 404 error (backend not available)
      if (err.response && err.response.status === 404) {
        console.warn('Notification API not available - backend service may not be running')
        error.value = 'Notification service not available'
        notifications.value = []
      } else {
        error.value = 'Failed to load notifications'
        console.error('Error loading notifications:', err)
        notifications.value = []
      }
    } finally {
      isLoading.value = false
    }
  }

  async function loadUnreadCount() {
    try {
      const response = await getUnreadNotificationCount()
      unreadCount.value = response.data || 0
    } catch (err) {
      // Check if it's a 404 error (backend not available)
      if (err.response && err.response.status === 404) {
        console.warn('Notification API not available - backend service may not be running')
        unreadCount.value = 0
      } else {
        console.error('Error loading unread count:', err)
        unreadCount.value = 0
      }
    }
  }

  async function markAsRead(notificationId) {
    try {
      await markNotificationAsRead(notificationId)
      
      // Update local state
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
      
      // Update unread count
      await loadUnreadCount()
      
      showSuccessToast('Notification marked as read')
    } catch (err) {
      error.value = 'Failed to mark notification as read'
      console.error('Error marking notification as read:', err)
      throw err
    }
  }

  async function markAllAsRead() {
    try {
      const unreadIds = unreadNotifications.value.map(n => n.id)
      
      // Mark all unread notifications as read
      await Promise.all(unreadIds.map(id => markNotificationAsRead(id)))
      
      // Update local state
      notifications.value.forEach(n => {
        if (!n.read) n.read = true
      })
      
      unreadCount.value = 0
      
      showSuccessToast('All notifications marked as read')
    } catch (err) {
      error.value = 'Failed to mark all notifications as read'
      console.error('Error marking all notifications as read:', err)
      throw err
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {
      read: null,
      page: 0,
      size: 20
    }
  }

  // Real-time polling
  function startPolling() {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
    }
    
    // Poll every 30 seconds for new notifications
    pollingInterval.value = setInterval(async () => {
      await loadUnreadCount()
      // Only load full notifications if there are new unread ones
      if (unreadCount.value > notifications.value.filter(n => !n.read).length) {
        await loadNotifications()
      }
    }, 30000)
  }

  function stopPolling() {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }

  // Initialize
  async function initialize() {
    await Promise.all([
      loadNotifications(),
      loadUnreadCount()
    ])
    startPolling()
  }

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    error,
    filters,
    
    // Computed
    unreadNotifications,
    readNotifications,
    hasUnread,
    lowStockNotifications,
    criticalStockNotifications,
    
    // Actions
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    setFilters,
    clearFilters,
    startPolling,
    stopPolling,
    initialize
  }
}) 