<template>
  <div class="notification-bell-container">
    <!-- Bell Button -->
    <button
      class="notification-bell"
      @click="toggleDropdown"
      :class="{ 
        active: isDropdownOpen,
        'has-critical': criticalStockCount > 0,
        'has-low-stock': lowStockCount > 0 && criticalStockCount === 0
      }"
      aria-label="Notifications"
    >
      <i class="bi bi-bell"></i>
      
      <!-- Critical Stock Badge -->
      <span
        v-if="criticalStockCount > 0"
        class="notification-badge critical-badge"
        :class="{ 'badge-lg': criticalStockCount > 99 }"
      >
        <i class="bi bi-exclamation-triangle-fill"></i>
        {{ criticalStockCount > 99 ? '99+' : criticalStockCount }}
      </span>
      
      <!-- Regular Badge -->
      <span
        v-else-if="unreadCount > 0"
        class="notification-badge"
        :class="{ 'badge-lg': unreadCount > 99 }"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
      
      <!-- Pulse Animation for Critical Stock -->
      <div v-if="criticalStockCount > 0" class="pulse-ring"></div>
    </button>

    <!-- Notifications Dropdown -->
    <div
      v-if="isDropdownOpen"
      class="notifications-dropdown"
      @click.stop
    >
      <!-- Header -->
      <div class="dropdown-header">
        <div class="header-content">
          <h6 class="dropdown-title">
            <i class="bi bi-bell"></i>
            Notifications
          </h6>
          <div class="notification-stats">
            <span v-if="criticalStockCount > 0" class="critical-count">
              <i class="bi bi-exclamation-triangle-fill"></i>
              {{ criticalStockCount }} critical
            </span>
            <span v-if="lowStockCount > 0" class="low-stock-count">
              <i class="bi bi-exclamation-circle"></i>
              {{ lowStockCount }} low stock
            </span>
          </div>
        </div>
        <div class="dropdown-actions">
          <button
            v-if="unreadCount > 0"
            class="btn btn-sm btn-outline-primary"
            @click="markAllAsRead"
            :disabled="isMarkingAllRead"
          >
            <i class="bi bi-check-all"></i>
            Mark all read
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="dropdown-loading">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span>Loading notifications...</span>
      </div>

      <!-- Notifications List -->
      <div v-else class="notifications-list">
        <!-- Critical Stock Notifications -->
        <div v-if="criticalStockNotifications.length > 0" class="notification-section">
          <div class="section-header critical">
            <i class="bi bi-exclamation-triangle-fill"></i>
            Critical Stock Alerts
          </div>
          <div
            v-for="notification in criticalStockNotifications"
            :key="notification.id"
            class="notification-item critical"
            :class="{ unread: !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon critical">
              <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            
            <div class="notification-content">
              <div class="notification-title">
                Critical Stock Alert
              </div>
              <div class="notification-message">
                {{ notification.message }}
              </div>
              <div class="stock-info">
                <span class="stock-badge critical">
                  <i class="bi bi-box"></i>
                  {{ notification.currentStock }} units left
                </span>
                <span class="notification-time">
                  {{ formatTime(notification.createdAt) }}
                </span>
              </div>
            </div>

            <div class="notification-actions">
              <button
                v-if="!notification.read"
                class="btn btn-sm btn-outline-danger"
                @click.stop="markAsRead(notification.id)"
                :disabled="isMarkingRead"
                title="Mark as read"
              >
                <i class="bi bi-check"></i>
              </button>
              <button
                class="btn btn-sm btn-primary"
                @click.stop="handleRestockClick(notification)"
                title="Restock product"
              >
                <i class="bi bi-plus-circle"></i>
                Restock
              </button>
            </div>
          </div>
        </div>

        <!-- Low Stock Notifications -->
        <div v-if="lowStockNotifications.length > 0" class="notification-section">
          <div class="section-header warning">
            <i class="bi bi-exclamation-circle"></i>
            Low Stock Alerts
          </div>
          <div
            v-for="notification in lowStockNotifications"
            :key="notification.id"
            class="notification-item warning"
            :class="{ unread: !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon warning">
              <i class="bi bi-exclamation-circle"></i>
            </div>
            
            <div class="notification-content">
              <div class="notification-title">
                Low Stock Alert
              </div>
              <div class="notification-message">
                {{ notification.message }}
              </div>
              <div class="stock-info">
                <span class="stock-badge warning">
                  <i class="bi bi-box"></i>
                  {{ notification.currentStock }} units left
                </span>
                <span class="notification-time">
                  {{ formatTime(notification.createdAt) }}
                </span>
              </div>
            </div>

            <div class="notification-actions">
              <button
                v-if="!notification.read"
                class="btn btn-sm btn-outline-warning"
                @click.stop="markAsRead(notification.id)"
                :disabled="isMarkingRead"
                title="Mark as read"
              >
                <i class="bi bi-check"></i>
              </button>
              <button
                class="btn btn-sm btn-warning"
                @click.stop="handleRestockClick(notification)"
                title="Restock product"
              >
                <i class="bi bi-plus-circle"></i>
                Restock
              </button>
            </div>
          </div>
        </div>

        <!-- Other Notifications -->
        <div
          v-for="notification in otherNotifications"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <i class="bi bi-info-circle"></i>
          </div>
          
          <div class="notification-content">
            <div class="notification-title">
              {{ notification.title || 'Notification' }}
            </div>
            <div class="notification-message">
              {{ notification.message }}
            </div>
            <div class="notification-time">
              {{ formatTime(notification.createdAt) }}
            </div>
          </div>

          <div class="notification-actions">
            <button
              v-if="!notification.read"
              class="btn btn-sm btn-outline-primary"
              @click.stop="markAsRead(notification.id)"
              :disabled="isMarkingRead"
            >
              <i class="bi bi-check"></i>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="notifications.length === 0" class="empty-notifications">
          <i class="bi bi-bell-slash"></i>
          <p>No notifications</p>
          <small>You're all caught up!</small>
        </div>
      </div>

      <!-- Footer -->
      <div class="dropdown-footer">
        <router-link
          to="/admin/notifications"
          class="btn btn-sm btn-outline-secondary w-100"
          @click="closeDropdown"
        >
          View All Notifications
        </router-link>
      </div>
    </div>

    <!-- Backdrop -->
    <div
      v-if="isDropdownOpen"
      class="dropdown-backdrop"
      @click="closeDropdown"
    ></div>

    <!-- Audio for notifications -->
    <audio ref="notificationSound" preload="auto">
      <!-- Using Web Audio API for notification sounds -->
    </audio>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useNotificationStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import { showSuccessToast } from '@/services/api'

const props = defineProps({
  showDropdown: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['notification-click', 'restock-click'])

const notificationStore = useNotificationStore()
const authStore = useAuthStore()

// Local state
const isDropdownOpen = ref(false)
const isMarkingRead = ref(false)
const isMarkingAllRead = ref(false)
const notificationSound = ref(null)
const previousUnreadCount = ref(0)

// Computed
const notifications = computed(() => notificationStore.notifications.slice(0, 10)) // Show first 10
const unreadCount = computed(() => notificationStore.unreadCount)
const isLoading = computed(() => notificationStore.isLoading)
const lowStockNotifications = computed(() => notificationStore.lowStockNotifications)
const criticalStockNotifications = computed(() => notificationStore.criticalStockNotifications)
const lowStockCount = computed(() => lowStockNotifications.value.length)
const criticalStockCount = computed(() => criticalStockNotifications.value.length)

const otherNotifications = computed(() => 
  notifications.value.filter(n => 
    n.type !== 'LOW_STOCK' && !n.read
  )
)

// Watch for new notifications and play sound
watch(unreadCount, (newCount, oldCount) => {
  if (newCount > oldCount && oldCount > 0) {
    playNotificationSound()
  }
  previousUnreadCount.value = newCount
})

// Methods
const toggleDropdown = () => {
  if (!props.showDropdown) return
  
  isDropdownOpen.value = !isDropdownOpen.value
  if (isDropdownOpen.value) {
    loadNotifications()
  }
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const loadNotifications = async () => {
  try {
    await notificationStore.loadNotifications()
  } catch (error) {
    console.error('Error loading notifications:', error)
  }
}

const markAsRead = async (notificationId) => {
  try {
    isMarkingRead.value = true
    await notificationStore.markAsRead(notificationId)
    showSuccessToast('Notification marked as read')
  } catch (error) {
    console.error('Error marking notification as read:', error)
  } finally {
    isMarkingRead.value = false
  }
}

const markAllAsRead = async () => {
  try {
    isMarkingAllRead.value = true
    await notificationStore.markAllAsRead()
    showSuccessToast('All notifications marked as read')
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
  } finally {
    isMarkingAllRead.value = false
  }
}

const handleNotificationClick = (notification) => {
  emit('notification-click', notification)
  
  if (!notification.read) {
    markAsRead(notification.id)
  }
  
  closeDropdown()
}

const handleRestockClick = (notification) => {
  emit('restock-click', notification)
  closeDropdown()
}

const playNotificationSound = () => {
  if (notificationSound.value) {
    notificationSound.value.play().catch(err => {
      console.log('Could not play notification sound:', err)
    })
  } else {
    // Fallback: Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (err) {
      console.log('Could not create fallback notification sound:', err)
    }
  }
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return date.toLocaleDateString()
}

// Click outside handler
const handleClickOutside = (event) => {
  if (!event.target.closest('.notification-bell-container')) {
    closeDropdown()
  }
}

// Lifecycle
onMounted(async () => {
  // Only load notifications for admin users
  if (authStore.user?.roles?.includes('ROLE_ADMIN')) {
    await notificationStore.initialize()
    previousUnreadCount.value = unreadCount.value
  }
  
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  notificationStore.stopPolling()
})
</script>

<style scoped>
.notification-bell-container {
  position: relative;
}

.notification-bell {
  position: relative;
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-bell:hover {
  background: var(--color-gray-100);
  color: var(--color-text-primary);
}

.notification-bell.active {
  background: var(--color-primary);
  color: var(--color-white);
}

.notification-bell.has-critical {
  color: var(--color-danger);
  animation: shake 0.5s ease-in-out;
}

.notification-bell.has-low-stock {
  color: var(--color-warning);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--color-danger);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  padding: 2px 6px;
  border-radius: var(--radius-full);
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(50%, -50%);
  z-index: 1;
}

.critical-badge {
  background: var(--color-danger);
  animation: pulse 2s infinite;
}

.notification-badge.badge-lg {
  font-size: 10px;
  padding: 2px 4px;
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border: 2px solid var(--color-danger);
  border-radius: 50%;
  animation: pulse-ring 2s infinite;
  pointer-events: none;
}

.notifications-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 450px;
  max-height: 600px;
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  margin-top: var(--spacing-sm);
  animation: slideDown 0.2s ease;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.header-content {
  flex: 1;
}

.dropdown-title {
  margin: 0 0 var(--spacing-xs) 0;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.notification-stats {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
}

.critical-count {
  color: var(--color-danger);
  font-weight: var(--font-weight-semibold);
}

.low-stock-count {
  color: var(--color-warning);
  font-weight: var(--font-weight-semibold);
}

.dropdown-loading {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.notifications-list {
  max-height: 450px;
  overflow-y: auto;
}

.notification-section {
  border-bottom: 1px solid var(--color-border-light);
}

.section-header {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.section-header.critical {
  background: var(--color-danger-50);
  color: var(--color-danger);
}

.section-header.warning {
  background: var(--color-warning-50);
  color: var(--color-warning);
}

.notification-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: var(--transition-fast);
}

.notification-item:hover {
  background: var(--color-bg-secondary);
}

.notification-item.unread {
  background: var(--color-primary-50);
}

.notification-item.unread:hover {
  background: var(--color-primary-100);
}

.notification-item.critical.unread {
  background: var(--color-danger-50);
}

.notification-item.critical.unread:hover {
  background: var(--color-danger-100);
}

.notification-item.warning.unread {
  background: var(--color-warning-50);
}

.notification-item.warning.unread:hover {
  background: var(--color-warning-100);
}

.notification-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-100);
  border-radius: var(--radius-md);
  font-size: var(--font-size-lg);
  color: var(--color-gray-600);
}

.notification-icon.critical {
  background: var(--color-danger-100);
  color: var(--color-danger);
}

.notification-icon.warning {
  background: var(--color-warning-100);
  color: var(--color-warning);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.notification-message {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
  line-height: var(--line-height-normal);
}

.stock-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.stock-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.stock-badge.critical {
  background: var(--color-danger-100);
  color: var(--color-danger);
}

.stock-badge.warning {
  background: var(--color-warning-100);
  color: var(--color-warning);
}

.notification-time {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}

.notification-actions {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xs);
}

.empty-notifications {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.empty-notifications i {
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
  color: var(--color-gray-400);
}

.empty-notifications small {
  color: var(--color-text-tertiary);
}

.dropdown-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  background: var(--color-bg-secondary);
}

.dropdown-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: calc(var(--z-dropdown) - 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0;
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}

/* Responsive */
@media (max-width: 480px) {
  .notifications-dropdown {
    width: 350px;
    right: -50px;
  }
  
  .notification-item {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .notification-actions {
    align-self: flex-end;
  }
  
  .stock-info {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style> 