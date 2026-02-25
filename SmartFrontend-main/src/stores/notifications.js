import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getAdminNotifications,
  markAdminNotificationAsRead,
  getAdminUnreadCount,
  getGeneralNotifications,
  markGeneralNotificationAsRead,
  getGeneralUnreadCount
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

      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()
      const isAdmin = authStore.user?.roles?.includes('ROLE_ADMIN')
      const userId = authStore.user?.id

      let allNotifications = []

      // Fetch General
      try {
        const generalResponse = await getGeneralNotifications(filters.value.read, filters.value.page, filters.value.size, userId)
        const generalList = generalResponse.data.content || generalResponse.data || []
        allNotifications.push(...generalList.map(n => {
          let cleanMessage = n.content || '';
          if (cleanMessage.includes('<') && cleanMessage.includes('>')) {
            const tmp = document.createElement("DIV");
            tmp.innerHTML = cleanMessage;
            const stylesAndScripts = tmp.querySelectorAll('script, style');
            stylesAndScripts.forEach(el => el.remove());
            cleanMessage = (tmp.textContent || tmp.innerText || "").replace(/\s+/g, ' ').trim();
          }
          return {
            ...n,
            id: `gen_${n.id}`,
            originalId: n.id,
            title: n.subject,
            message: cleanMessage,
            read: n.status === 'READ',
            isGeneral: true
          }
        }))
      } catch (err) {
        console.error('Error general notifications:', err)
      }

      // Fetch Admin
      if (isAdmin) {
        try {
          const adminResponse = await getAdminNotifications(filters.value.read, filters.value.page, filters.value.size)
          const adminList = adminResponse.data.content || adminResponse.data || []
          allNotifications.push(...adminList.map(n => ({
            ...n,
            id: `admin_${n.id}`,
            originalId: n.id,
            isGeneral: false
          })))
        } catch (err) {
          console.error('Error admin notifications:', err)
        }

        try {
          const adminGeneralResponse = await getGeneralNotifications(filters.value.read, filters.value.page, filters.value.size, 0)
          const adminGeneralList = adminGeneralResponse.data.content || adminGeneralResponse.data || []
          allNotifications.push(...adminGeneralList.map(n => {
            let cleanMessage = n.content || '';
            if (cleanMessage.includes('<') && cleanMessage.includes('>')) {
              const tmp = document.createElement("DIV");
              tmp.innerHTML = cleanMessage;
              const stylesAndScripts = tmp.querySelectorAll('script, style');
              stylesAndScripts.forEach(el => el.remove());
              cleanMessage = (tmp.textContent || tmp.innerText || "").replace(/\s+/g, ' ').trim();
            }
            return {
              ...n,
              id: `gen_${n.id}`,
              originalId: n.id,
              title: n.subject,
              message: cleanMessage,
              read: n.status === 'READ',
              isGeneral: true
            }
          }))
        } catch (err) {
          console.error('Error global admin general notifications:', err)
        }
      }

      allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      notifications.value = allNotifications
    } catch (err) {
      error.value = 'Failed to load notifications'
      console.error('Error loading notifications:', err)
      notifications.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function loadUnreadCount() {
    try {
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()
      const isAdmin = authStore.user?.roles?.includes('ROLE_ADMIN')
      const userId = authStore.user?.id

      let totalUnread = 0

      try {
        const generalResponse = await getGeneralUnreadCount(userId)
        totalUnread += (generalResponse.data || 0)
      } catch (err) { }

      if (isAdmin) {
        try {
          const adminResponse = await getAdminUnreadCount()
          totalUnread += (adminResponse.data || 0)
        } catch (err) { }

        try {
          const adminGeneralResponse = await getGeneralUnreadCount(0)
          totalUnread += (adminGeneralResponse.data || 0)
        } catch (err) { }
      }

      unreadCount.value = totalUnread
    } catch (err) {
      console.error('Error loading unread count:', err)
      unreadCount.value = 0
    }
  }

  async function markAsRead(notificationId) {
    try {
      const notification = notifications.value.find(n => n.id === notificationId)
      if (!notification) return

      if (notification.isGeneral) {
        await markGeneralNotificationAsRead(notification.originalId)
      } else {
        await markAdminNotificationAsRead(notification.originalId)
      }

      // Update local state
      notification.read = true
      if (notification.isGeneral) {
        notification.status = 'READ'
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
      const unreadGeneral = unreadNotifications.value.filter(n => n.isGeneral)
      const unreadAdmin = unreadNotifications.value.filter(n => !n.isGeneral)

      // Mark all unread notifications as read
      await Promise.all([
        ...unreadGeneral.map(n => markGeneralNotificationAsRead(n.originalId)),
        ...unreadAdmin.map(n => markAdminNotificationAsRead(n.originalId))
      ])

      // Update local state
      notifications.value.forEach(n => {
        if (!n.read) {
          n.read = true
          if (n.isGeneral) n.status = 'READ'
        }
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