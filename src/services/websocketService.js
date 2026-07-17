/**
 * WebSocket service for real-time notifications.
 *
 * Manages WebSocket connection with automatic reconnection,
 * Keycloak JWT authentication, and event handling.
 */
import { getToken, isAuthenticated as kcIsAuthenticated } from '@/services/keycloak'

class WebSocketService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000 // Start with 1 second
    this.maxReconnectDelay = 30000 // Max 30 seconds
    this.pingInterval = null
    this.isConnecting = false
    this.isIntentionallyClosed = false
    this.eventHandlers = new Map()
  }

  /**
   * Get the WebSocket URL based on the current environment.
   */
  getWebSocketUrl(token) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    let host = window.location.host

    // In development, the WebSocket endpoint might be on a different port
    if (import.meta.env.DEV || window.location.port === '3001' || window.location.port === '3002' || window.location.port === '5173') {
      // Development: connect to the API server (Daphne on port 8002)
      host = window.location.hostname + ':8002'
    }

    return `${protocol}//${host}/ws/notifications/?token=${encodeURIComponent(token)}`
  }

  /**
   * Connect to the WebSocket server.
   * @param {string} token - JWT access token for authentication
   */
  connect(token) {
    // Use Keycloak token if available, otherwise fall back to provided token
    const effectiveToken = (kcIsAuthenticated() && getToken()) || token
    if (!effectiveToken) {
      return
    }

    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return
    }

    this.isConnecting = true
    this.isIntentionallyClosed = false

    const url = this.getWebSocketUrl(effectiveToken)

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.reconnectDelay = 1000
        this.startPing()
        this.emit('connected')
      }

      this.ws.onclose = (event) => {
        this.isConnecting = false
        this.stopPing()
        this.emit('disconnected', { code: event.code, reason: event.reason })

        // Auto-reconnect if not intentionally closed
        if (!this.isIntentionallyClosed && event.code !== 4001) {
          this.scheduleReconnect(effectiveToken)
        }
      }

      this.ws.onerror = (error) => {
        this.isConnecting = false
        this.emit('error', error)
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (err) {
          // silenced
        }
      }
    } catch (err) {
      this.isConnecting = false
      this.scheduleReconnect(effectiveToken)
    }
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect() {
    this.isIntentionallyClosed = true
    this.stopPing()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

  }

  /**
   * Schedule a reconnection attempt with exponential backoff.
   */
  scheduleReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect_failed')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay)

    setTimeout(() => {
      if (!this.isIntentionallyClosed) {
        this.connect(token)
      }
    }, delay)
  }

  /**
   * Start sending periodic ping messages to keep the connection alive.
   */
  startPing() {
    this.stopPing()
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000) // Ping every 30 seconds
  }

  /**
   * Stop the ping interval.
   */
  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  /**
   * Send a message to the WebSocket server.
   * @param {object} data - Data to send (will be JSON stringified)
   */
  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
      return true
    }
    return false
  }

  /**
   * Handle incoming WebSocket messages.
   */
  handleMessage(data) {
    const { type } = data

    switch (type) {
      case 'connection_established':
        this.emit('connection_established', data)
        break

      case 'new_notification':
        this.emit('new_notification', data.notification)
        break

      case 'notification_read':
        this.emit('notification_read', data.notification_id)
        break

      case 'unread_count':
        this.emit('unread_count', data.count)
        break

      case 'mark_read_response':
        this.emit('mark_read_response', data)
        break

      case 'mark_all_read_response':
        this.emit('mark_all_read_response', data)
        break

      case 'pong':
        // Heartbeat response, no action needed
        break

      default:
        // Unknown message type
    }
  }

  /**
   * Mark a notification as read via WebSocket.
   */
  markAsRead(notificationId) {
    return this.send({
      type: 'mark_read',
      notification_id: notificationId
    })
  }

  /**
   * Mark all notifications as read via WebSocket.
   */
  markAllAsRead() {
    return this.send({
      type: 'mark_all_read'
    })
  }

  /**
   * Request the current unread count.
   */
  requestUnreadCount() {
    return this.send({
      type: 'get_unread_count'
    })
  }

  /**
   * Subscribe to WebSocket events.
   * @param {string} event - Event name
   * @param {function} handler - Event handler function
   * @returns {function} Unsubscribe function
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event).add(handler)

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  /**
   * Unsubscribe from WebSocket events.
   * @param {string} event - Event name
   * @param {function} handler - Event handler function
   */
  off(event, handler) {
    this.eventHandlers.get(event)?.delete(handler)
  }

  /**
   * Emit an event to all registered handlers.
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    this.eventHandlers.get(event)?.forEach(handler => {
      try {
        handler(data)
      } catch (err) {
        // silenced
      }
    })
  }

  /**
   * Check if WebSocket is currently connected.
   */
  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Export singleton instance
export const websocketService = new WebSocketService()
export default websocketService
