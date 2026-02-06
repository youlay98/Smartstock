import { notificationApi } from './api'

// Get notifications with filters
export function getNotifications(read = null, page = 0, size = 20) {
  const params = { page, size }
  if (read !== null) {
    params.read = read
  }
  return notificationApi.get('', { params })
}

// Mark notification as read
export function markNotificationAsRead(notificationId) {
  return notificationApi.put(`/${notificationId}/read`)
}

// Get unread notification count
export function getUnreadNotificationCount() {
  return notificationApi.get('/count')
}

// Manually check for low stock notifications
export function checkLowStockNotifications() {
  return notificationApi.post('/check-low-stock')
} 