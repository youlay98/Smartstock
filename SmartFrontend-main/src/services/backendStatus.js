import axios from 'axios'

const gatewayBase = import.meta.env.VITE_API_GATEWAY_BASE_URL || '/api'

// Check if backend is available
export async function checkBackendStatus() {
  try {
    const response = await axios.get(`${gatewayBase}/products`, {
      timeout: 5000 // 5 second timeout
    })
    return response.status === 200
  } catch (error) {
    console.warn('Backend services not available:', error.message)
    return false
  }
}

// Get backend status with retry
export async function getBackendStatusWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const isAvailable = await checkBackendStatus()
    if (isAvailable) {
      return true
    }
    
    // Wait before retry (exponential backoff)
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
  
  return false
}

// Show backend status notification
export function showBackendStatusNotification(isAvailable) {
  if (!isAvailable) {
    console.warn('⚠️ Backend services are not available. Some features may be limited.')
    // You can add a toast notification here if needed
  }
} 