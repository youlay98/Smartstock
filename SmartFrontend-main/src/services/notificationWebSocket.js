import { Client } from '@stomp/stompjs'
import { useToast } from 'vue-toastification'

class NotificationWebSocketService {
    constructor() {
        this.stompClient = null
        this.toast = useToast()
    }

    connect(user) {
        if (!user || (!user.id && !user.roles)) {
            console.warn('Cannot connect to WebSockets without user information.')
            return
        }

        if (this.stompClient && this.stompClient.connected) {
            console.log('WebSocket already connected')
            return
        }

        // Because Gateway routes /ws to NotificationService
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${wsProtocol}//${window.location.hostname}:8080/ws`

        this.stompClient = new Client({
            brokerURL: wsUrl,
            reconnectDelay: 5000, // Try to reconnect every 5s if disconnected
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('Connected to WebSocket for Notifications!')

                // 1. All users subscribe to their personal topic
                if (user.id) {
                    const userTopic = `/topic/user.${user.id}`
                    this.stompClient.subscribe(userTopic, (message) => {
                        if (message.body) {
                            const notification = JSON.parse(message.body)
                            this.showToast(notification)
                            this.addToStore(notification)
                        }
                    })
                }

                // 2. If user is an Admin, they also subscribe to global admin notifications
                if (user.roles && user.roles.includes('ROLE_ADMIN')) {
                    this.stompClient.subscribe('/topic/admin.notifications', (message) => {
                        if (message.body) {
                            const notification = JSON.parse(message.body)
                            this.showToast(notification)
                            this.addToStore(notification)
                        }
                    })
                }
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message'])
                console.error('Additional details: ' + frame.body)
            },
            onWebSocketError: (error) => {
                console.error('Error with WebSocket connection', error)
            }
        })

        this.stompClient.activate()
    }

    disconnect() {
        if (this.stompClient !== null) {
            this.stompClient.deactivate()
            console.log('Disconnected from WebSockets')
        }
    }

    showToast(notification) {
        // Determine toast type based on subject or type
        let toastType = 'info'
        if (notification.type === 'EMAIL') { // For now we're reusing EMAIL type structs
            toastType = 'success'
        }

        this.toast(notification.subject, {
            type: toastType,
            position: 'top-right',
            timeout: 5000,
            closeOnClick: true,
            pauseOnFocusLoss: true,
            pauseOnHover: true,
            draggable: true,
            draggablePercent: 0.6,
            showCloseButtonOnHover: false,
            hideProgressBar: false,
            closeButton: "button",
            icon: true,
            rtl: false
        })
    }

    addToStore(notification) {
        // Dynamically import to avoid circular dependency
        import('@/stores/notifications').then(({ useNotificationStore }) => {
            const store = useNotificationStore()
            // Make sure not already in store
            const exists = store.notifications.some(n => n.id === notification.id)
            if (!exists) {
                store.notifications.unshift({
                    ...notification,
                    id: notification.id || Date.now() + Math.random(),
                    read: false,
                    createdAt: new Date().toISOString()
                })
                store.unreadCount++
            }
        })
    }
}

// Export a singleton instance
export const notificationWebSocket = new NotificationWebSocketService()
