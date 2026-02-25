import { notificationApi, generalNotificationApi } from './api'

// === Admin Notifications (Low Stock, from ProductService) ===
export function getAdminNotifications(read = null, page = 0, size = 20) {
  const params = { page, size }
  if (read !== null) params.read = read
  return notificationApi.get('', { params })
}

export function markAdminNotificationAsRead(notificationId) {
  return notificationApi.put(`/${notificationId}/read`)
}

export function getAdminUnreadCount() {
  return notificationApi.get('/count')
}

export function checkLowStockNotifications() {
  return notificationApi.post('/check-low-stock')
}

// === General Notifications (Orders, Welcome, from NotificationService) ===
export function getGeneralNotifications(read = null, page = 0, size = 20, userId = null) {
  const params = { page, size }
  if (read !== null) params.read = read
  if (userId !== null) params.userId = userId
  return generalNotificationApi.get('', { params })
}

export function markGeneralNotificationAsRead(notificationId) {
  return generalNotificationApi.put(`/${notificationId}/read`)
}

export function getGeneralUnreadCount(userId = null) {
  const params = {}
  if (userId !== null) params.userId = userId
  return generalNotificationApi.get('/count', { params })
} 