/**
 * WebSocket utility for connecting to the backend
 * Replaces Socket.io with native WebSocket
 */

export class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url
    this.options = {
      reconnect: options.reconnect !== false, // Default: true
      reconnectDelay: options.reconnectDelay || 1000,
      reconnectAttempts: options.reconnectAttempts || 5,
      ...options
    }
    this.ws = null
    this.listeners = {}
    this.reconnectAttempts = 0
    this.shouldReconnect = true
    this.isConnecting = false
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return
    }

    this.isConnecting = true

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        // console.log('✅ WebSocket connected:', this.url)
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.emit('connect')
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          // Handle different message types
          if (message.type) {
            this.emit(message.type, message.data || message)
          } else {
            // If no type, emit the whole message
            this.emit('message', message)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
          // Emit raw message if JSON parse fails
          this.emit('message', event.data)
        }
      }

      this.ws.onerror = (error) => {
        // Silent failure - don't spam console
        this.isConnecting = false
        this.emit('error', error)
      }

      this.ws.onclose = (event) => {
        // console.log('⚠️ WebSocket disconnected:', event.code, event.reason)
        this.isConnecting = false
        this.emit('disconnect', event)

        // Attempt to reconnect if enabled and not manually closed
        if (this.shouldReconnect && this.options.reconnect) {
          if (this.reconnectAttempts < this.options.reconnectAttempts) {
            this.reconnectAttempts++
            // console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.options.reconnectAttempts})...`)
            setTimeout(() => {
              this.connect()
            }, this.options.reconnectDelay)
          } else {
            // console.warn('WebSocket: Max reconnection attempts reached. Live updates disabled.')
            this.emit('reconnect_failed')
          }
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
      this.isConnecting = false
      this.emit('error', error)
    }
  }

  disconnect() {
    this.shouldReconnect = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners = {}
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event, callback) {
    if (!this.listeners[event]) return

    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    } else {
      delete this.listeners[event]
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in WebSocket listener for ${event}:`, error)
        }
      })
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (typeof data === 'string') {
        this.ws.send(data)
      } else {
        this.ws.send(JSON.stringify(data))
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message.')
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

// Singleton instance for dashboard updates
let dashboardWebSocket = null

export function getDashboardWebSocket() {
  if (!dashboardWebSocket) {
    // Use the hardcoded backend URL
    const wsUrl = 'ws://3.231.155.2:8000/ws'

    dashboardWebSocket = new WebSocketClient(wsUrl, {
      reconnect: true,
      reconnectDelay: 1000,
      reconnectAttempts: 3
    })
    dashboardWebSocket.connect()
  }
  return dashboardWebSocket
}





