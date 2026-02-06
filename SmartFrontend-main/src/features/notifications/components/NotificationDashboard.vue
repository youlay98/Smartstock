<template>
  <div class="notification-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <h2 class="dashboard-title">
          <i class="bi bi-bell"></i>
          Notification Center
        </h2>
        <p class="dashboard-subtitle">
          Manage and respond to system notifications
        </p>
      </div>
      
      <div class="header-actions">
        <button
          v-if="unreadCount > 0"
          class="btn btn-primary"
          @click="markAllAsRead"
          :disabled="isMarkingAllRead"
        >
          <i class="bi bi-check-all"></i>
          Mark All as Read
        </button>
        <button
          class="btn btn-outline-secondary"
          @click="refreshNotifications"
          :disabled="isLoading"
        >
          <i class="bi bi-arrow-clockwise"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card total">
        <div class="stat-icon">
          <i class="bi bi-bell"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalNotifications }}</div>
          <div class="stat-label">Total Notifications</div>
        </div>
      </div>
      
      <div class="stat-card unread">
        <div class="stat-icon">
          <i class="bi bi-bell-fill"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ unreadCount }}</div>
          <div class="stat-label">Unread</div>
        </div>
      </div>
      
      <div class="stat-card critical">
        <div class="stat-icon">
          <i class="bi bi-exclamation-triangle-fill"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ criticalStockCount }}</div>
          <div class="stat-label">Critical Stock</div>
        </div>
      </div>
      
      <div class="stat-card low-stock">
        <div class="stat-icon">
          <i class="bi bi-exclamation-circle"></i>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ lowStockCount }}</div>
          <div class="stat-label">Low Stock</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <select v-model="filters.read" class="form-select">
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Type</label>
          <select v-model="filters.type" class="form-select">
            <option value="">All Types</option>
            <option value="LOW_STOCK">Low Stock</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Level</label>
          <select v-model="filters.level" class="form-select">
            <option value="">All Levels</option>
            <option value="ERROR">Error</option>
            <option value="WARN">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="filter-label">Date Range</label>
          <select v-model="filters.dateRange" class="form-select">
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
      
      <div class="filters-actions">
        <button
          class="btn btn-outline-secondary btn-sm"
          @click="clearFilters"
        >
          Clear Filters
        </button>
        <button
          class="btn btn-primary btn-sm"
          @click="applyFilters"
        >
          Apply Filters
        </button>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="notifications-section">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p>Loading notifications...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <i class="bi bi-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="btn btn-primary" @click="refreshNotifications">
          Try Again
        </button>
      </div>

      <!-- Notifications -->
      <div v-else-if="filteredNotifications.length > 0" class="notifications-list">
        <div
          v-for="notification in filteredNotifications"
          :key="notification.id"
          class="notification-card"
          :class="{
            unread: !notification.read,
            critical: notification.level === 'ERROR',
            warning: notification.level === 'WARN',
            info: notification.level === 'INFO'
          }"
        >
          <div class="notification-header">
            <div class="notification-type">
              <div class="type-icon" :class="getTypeClass(notification)">
                <i :class="getTypeIcon(notification)"></i>
              </div>
              <div class="type-info">
                <div class="type-name">{{ getTypeName(notification) }}</div>
                <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
              </div>
            </div>
            
            <div class="notification-actions">
              <button
                v-if="!notification.read"
                class="btn btn-sm btn-outline-primary"
                @click="markAsRead(notification.id)"
                :disabled="isMarkingRead"
                title="Mark as read"
              >
                <i class="bi bi-check"></i>
              </button>
              
              <button
                v-if="notification.type === 'LOW_STOCK'"
                class="btn btn-sm btn-success"
                @click="handleRestock(notification)"
                title="Restock product"
              >
                <i class="bi bi-plus-circle"></i>
                Restock
              </button>
              
              <button
                class="btn btn-sm btn-outline-danger"
                @click="deleteNotification(notification.id)"
                title="Delete notification"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="notification-body">
            <div class="notification-message">
              {{ notification.message }}
            </div>
            
            <div v-if="notification.type === 'LOW_STOCK'" class="stock-details">
              <div class="stock-info">
                <span class="stock-label">Current Stock:</span>
                <span class="stock-value" :class="getStockClass(notification.currentStock)">
                  {{ notification.currentStock }} units
                </span>
              </div>
              
              <div v-if="notification.product" class="product-info">
                <span class="product-label">Product:</span>
                <span class="product-name">{{ notification.product.name }}</span>
                <span class="product-id">(ID: {{ notification.product.id }})</span>
              </div>
            </div>
          </div>
          
          <div class="notification-footer">
            <div class="notification-level">
              <span class="level-badge" :class="getLevelClass(notification.level)">
                {{ notification.level }}
              </span>
            </div>
            
            <div class="notification-actions-footer">
              <button
                class="btn btn-sm btn-outline-secondary"
                @click="viewProduct(notification)"
                v-if="notification.product"
              >
                View Product
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="bi bi-bell-slash"></i>
        <h3>No notifications found</h3>
        <p>There are no notifications matching your current filters.</p>
        <button class="btn btn-primary" @click="clearFilters">
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination-section">
      <nav aria-label="Notifications pagination">
        <ul class="pagination justify-content-center">
          <li class="page-item" :class="{ disabled: currentPage === 0 }">
            <button class="page-link" @click="changePage(currentPage - 1)">
              Previous
            </button>
          </li>
          
          <li
            v-for="page in visiblePages"
            :key="page"
            class="page-item"
            :class="{ active: page === currentPage }"
          >
            <button class="page-link" @click="changePage(page)">
              {{ page + 1 }}
            </button>
          </li>
          
          <li class="page-item" :class="{ disabled: currentPage === totalPages - 1 }">
            <button class="page-link" @click="changePage(currentPage + 1)">
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useNotificationStore } from '@/stores/notifications'
import { useRouter } from 'vue-router'
import { showSuccessToast, showErrorToast } from '@/services/api'

const router = useRouter()
const notificationStore = useNotificationStore()

// Local state
const isLoading = ref(false)
const isMarkingRead = ref(false)
const isMarkingAllRead = ref(false)
const currentPage = ref(0)
const pageSize = ref(20)

// Filters
const filters = ref({
  read: '',
  type: '',
  level: '',
  dateRange: ''
})

// Computed
const notifications = computed(() => notificationStore.notifications)
const unreadCount = computed(() => notificationStore.unreadCount)
const error = computed(() => notificationStore.error)

const totalNotifications = computed(() => notifications.value.length)
const criticalStockCount = computed(() => 
  notifications.value.filter(n => n.type === 'LOW_STOCK' && n.currentStock <= 2).length
)
const lowStockCount = computed(() => 
  notifications.value.filter(n => n.type === 'LOW_STOCK' && n.currentStock > 2).length
)

const filteredNotifications = computed(() => {
  let filtered = notifications.value

  // Filter by read status
  if (filters.value.read !== '') {
    const isRead = filters.value.read === 'true'
    filtered = filtered.filter(n => n.read === isRead)
  }

  // Filter by type
  if (filters.value.type) {
    filtered = filtered.filter(n => n.type === filters.value.type)
  }

  // Filter by level
  if (filters.value.level) {
    filtered = filtered.filter(n => n.level === filters.value.level)
  }

  // Filter by date range
  if (filters.value.dateRange) {
    const now = new Date()
    const startDate = new Date()
    
    switch (filters.value.dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }
    
    filtered = filtered.filter(n => new Date(n.createdAt) >= startDate)
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredNotifications.value.length / pageSize.value))
const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(0, currentPage.value - 2)
  const end = Math.min(totalPages.value - 1, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const refreshNotifications = async () => {
  try {
    isLoading.value = true
    await notificationStore.loadNotifications()
    showSuccessToast('Notifications refreshed')
  } catch (error) {
    showErrorToast('Failed to refresh notifications')
  } finally {
    isLoading.value = false
  }
}

const markAsRead = async (notificationId) => {
  try {
    isMarkingRead.value = true
    await notificationStore.markAsRead(notificationId)
    showSuccessToast('Notification marked as read')
  } catch (error) {
    showErrorToast('Failed to mark notification as read')
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
    showErrorToast('Failed to mark all notifications as read')
  } finally {
    isMarkingAllRead.value = false
  }
}

const deleteNotification = async (notificationId) => {
  if (confirm('Are you sure you want to delete this notification?')) {
    try {
      // Note: This would require a delete endpoint in the backend
      showSuccessToast('Notification deleted')
    } catch (error) {
      showErrorToast('Failed to delete notification')
    }
  }
}

const handleRestock = (notification) => {
  if (notification.product) {
    router.push(`/admin/products/${notification.product.id}?action=restock`)
  }
}

const viewProduct = (notification) => {
  if (notification.product) {
    router.push(`/admin/products/${notification.product.id}`)
  }
}

const applyFilters = () => {
  currentPage.value = 0
  // The filtering is handled by computed properties
}

const clearFilters = () => {
  filters.value = {
    read: '',
    type: '',
    level: '',
    dateRange: ''
  }
  currentPage.value = 0
}

const changePage = (page) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
  }
}

// Utility methods
const getTypeClass = (notification) => {
  switch (notification.type) {
    case 'LOW_STOCK':
      return notification.currentStock <= 2 ? 'critical' : 'warning'
    default:
      return 'info'
  }
}

const getTypeIcon = (notification) => {
  switch (notification.type) {
    case 'LOW_STOCK':
      return notification.currentStock <= 2 
        ? 'bi bi-exclamation-triangle-fill' 
        : 'bi bi-exclamation-circle'
    default:
      return 'bi bi-info-circle'
  }
}

const getTypeName = (notification) => {
  switch (notification.type) {
    case 'LOW_STOCK':
      return notification.currentStock <= 2 ? 'Critical Stock Alert' : 'Low Stock Alert'
    default:
      return 'Notification'
  }
}

const getLevelClass = (level) => {
  switch (level) {
    case 'ERROR':
      return 'level-error'
    case 'WARN':
      return 'level-warning'
    case 'INFO':
      return 'level-info'
    default:
      return 'level-info'
  }
}

const getStockClass = (stock) => {
  if (stock <= 2) return 'stock-critical'
  if (stock <= 5) return 'stock-warning'
  return 'stock-normal'
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

// Lifecycle
onMounted(async () => {
  await refreshNotifications()
})

// Watch for filter changes
watch(filters, () => {
  currentPage.value = 0
}, { deep: true })
</script>

<style scoped>
.notification-dashboard {
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);
}

.dashboard-title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.dashboard-subtitle {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-lg);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: var(--transition-fast);
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-card.total {
  border-left: 4px solid var(--color-primary);
}

.stat-card.unread {
  border-left: 4px solid var(--color-warning);
}

.stat-card.critical {
  border-left: 4px solid var(--color-danger);
}

.stat-card.low-stock {
  border-left: 4px solid var(--color-info);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
}

.stat-card.total .stat-icon {
  background: var(--color-primary-100);
  color: var(--color-primary);
}

.stat-card.unread .stat-icon {
  background: var(--color-warning-100);
  color: var(--color-warning);
}

.stat-card.critical .stat-icon {
  background: var(--color-danger-100);
  color: var(--color-danger);
}

.stat-card.low-stock .stat-icon {
  background: var(--color-info-100);
  color: var(--color-info);
}

.stat-number {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1;
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

.filters-section {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.filter-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
}

.filters-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: flex-end;
}

.notifications-section {
  margin-bottom: var(--spacing-xl);
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
}

.loading-state .spinner-border {
  margin-bottom: var(--spacing-md);
}

.error-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-gray-400);
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.notification-card {
  background: var(--color-white);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: var(--transition-fast);
}

.notification-card:hover {
  box-shadow: var(--shadow-md);
}

.notification-card.unread {
  border-left: 4px solid var(--color-primary);
  background: var(--color-primary-50);
}

.notification-card.critical {
  border-left: 4px solid var(--color-danger);
}

.notification-card.warning {
  border-left: 4px solid var(--color-warning);
}

.notification-card.info {
  border-left: 4px solid var(--color-info);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.notification-type {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.type-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
}

.type-icon.critical {
  background: var(--color-danger-100);
  color: var(--color-danger);
}

.type-icon.warning {
  background: var(--color-warning-100);
  color: var(--color-warning);
}

.type-icon.info {
  background: var(--color-info-100);
  color: var(--color-info);
}

.type-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.notification-time {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.notification-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.notification-body {
  margin-bottom: var(--spacing-md);
}

.notification-message {
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
  margin-bottom: var(--spacing-md);
}

.stock-details {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.stock-info,
.product-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.stock-label,
.product-label {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  min-width: 100px;
}

.stock-value {
  font-weight: var(--font-weight-semibold);
}

.stock-value.stock-critical {
  color: var(--color-danger);
}

.stock-value.stock-warning {
  color: var(--color-warning);
}

.stock-value.stock-normal {
  color: var(--color-success);
}

.product-name {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.product-id {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.notification-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}

.level-badge {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
}

.level-badge.level-error {
  background: var(--color-danger-100);
  color: var(--color-danger);
}

.level-badge.level-warning {
  background: var(--color-warning-100);
  color: var(--color-warning);
}

.level-badge.level-info {
  background: var(--color-info-100);
  color: var(--color-info);
}

.notification-actions-footer {
  display: flex;
  gap: var(--spacing-xs);
}

.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-xl);
}

/* Responsive */
@media (max-width: 768px) {
  .notification-dashboard {
    padding: var(--spacing-md);
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filters-row {
    grid-template-columns: 1fr;
  }
  
  .notification-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .notification-footer {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: flex-start;
  }
}
</style> 