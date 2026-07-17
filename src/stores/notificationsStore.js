import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { axiosInstance } from '@/main.js'
import { websocketService } from '@/services/websocketService.js'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const loading = ref(false)
  const error = ref(null)
  const wsConnected = ref(false)
  const wsToken = ref(null)

  const isLocalNotification = (notification) => {
    return notification?.metadata?.source === 'mes-alert' || String(notification?.id || '').startsWith('mes-alert-')
  }

  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.read)
  })

  const readNotifications = computed(() => {
    return notifications.value.filter(n => n.read)
  })

  /**
   * Initialize WebSocket connection for real-time notifications.
   * Should be called after user login with the JWT access token.
   */
  const initWebSocket = (accessToken) => {
    if (!accessToken) return

    wsToken.value = accessToken

    // Set up WebSocket event handlers
    websocketService.on('connected', () => {
      wsConnected.value = true
    })

    websocketService.on('disconnected', () => {
      wsConnected.value = false
    })

    websocketService.on('connection_established', (data) => {
      // Server sends initial unread count on connection
      if (data.unread_count !== undefined) {
        loadNotifications()
      }
    })

    websocketService.on('new_notification', (notification) => {
      addNotification(notification)
    })

    websocketService.on('notification_read', (notificationId) => {
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification && !notification.read) {
        notification.read = true
        notification.read_at = new Date().toISOString()
      }
    })

    websocketService.on('reconnect_failed', () => {
      // silenced
    })

    websocketService.connect(accessToken)
  }

  /**
   * Disconnect WebSocket connection.
   */
  const disconnectWebSocket = () => {
    websocketService.disconnect()
    wsConnected.value = false
    wsToken.value = null
  }

  /**
   * Reconnect WebSocket with stored token.
   */
  const reconnectWebSocket = () => {
    if (wsToken.value) {
      websocketService.connect(wsToken.value)
    }
  }

  /**
   * Add a new notification to the store.
   */
  const addNotification = (notification) => {
    const exists = notifications.value.some(n => n.id === notification.id)
    if (!exists) {
      notifications.value.unshift(notification)
    }
  }

  const loadNotifications = async () => {
    loading.value = true
    error.value = null
    try {
      const localNotifications = notifications.value.filter(isLocalNotification)
      const response = await axiosInstance.get('notifications/')
      const notifsList = Array.isArray(response.data) ? response.data : (response.data.results || [])
      const merged = [...localNotifications]
      notifsList.forEach((notif) => {
        if (!merged.some(existing => existing.id === notif.id)) {
          merged.push(notif)
        }
      })
      notifications.value = merged
    } catch (err) {
      error.value = err
      notifications.value = notifications.value.filter(isLocalNotification)
    } finally {
      loading.value = false
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await axiosInstance.get('notifications/unread_count/')
      return response.data.count || 0
    } catch (err) {
      return 0
    }
  }

  const markAsRead = async (id) => {
    const localNotification = notifications.value.find(n => n.id === id && isLocalNotification(n))
    if (localNotification) {
      localNotification.read = true
      localNotification.read_at = new Date().toISOString()
      return true
    }

    try {
      await axiosInstance.patch(`notifications/${id}/mark_as_read/`)
      const notification = notifications.value.find(n => n.id === id)
      if (notification) {
        notification.read = true
        notification.read_at = new Date().toISOString()
      }
      websocketService.markAsRead(id)
      return true
    } catch (err) {
      return false
    }
  }

  const markAllAsRead = async () => {
    const localNotifications = notifications.value.filter(n => !n.read && isLocalNotification(n))
    localNotifications.forEach((notification) => {
      notification.read = true
      notification.read_at = new Date().toISOString()
    })

    try {
      await axiosInstance.post('notifications/mark_all_as_read/')
      notifications.value.forEach(n => {
        n.read = true
        n.read_at = new Date().toISOString()
      })
      websocketService.markAllAsRead()
      return true
    } catch (err) {
      return false
    }
  }

  const deleteNotification = async (id) => {
    const localNotification = notifications.value.find(n => n.id === id && isLocalNotification(n))
    if (localNotification) {
      notifications.value = notifications.value.filter(n => n.id !== id)
      return true
    }

    try {
      await axiosInstance.delete(`notifications/${id}/`)
      notifications.value = notifications.value.filter(n => n.id !== id)
      return true
    } catch (err) {
      return false
    }
  }

  const createNotification = async (notificationData) => {
    try {
      const response = await axiosInstance.post('notifications/', notificationData)
      notifications.value.unshift(response.data)
      return response.data
    } catch (err) {
      throw err
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  return {
    notifications,
    loading,
    error,
    wsConnected,
    unreadCount,
    unreadNotifications,
    readNotifications,
    initWebSocket,
    disconnectWebSocket,
    reconnectWebSocket,
    addNotification,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    clearNotifications
  }
})

