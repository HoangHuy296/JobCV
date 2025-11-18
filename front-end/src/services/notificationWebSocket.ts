/**
 * WebSocket service for real-time notifications
 */

type NotificationCallback = (notification: any) => void;
type ConnectionCallback = () => void;
type ErrorCallback = (error: Event) => void;

class NotificationWebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  
  // Callbacks
  private onNotificationCallbacks: NotificationCallback[] = [];
  private onConnectCallbacks: ConnectionCallback[] = [];
  private onDisconnectCallbacks: ConnectionCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];

  constructor() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    // Extract host from API URL
    const apiHost = apiUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '');
    this.url = `${wsProtocol}//${apiHost}/ws/notifications`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.token = token;
    this.isIntentionallyClosed = false;
    
    try {
      const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.startPingInterval();
        this.onConnectCallbacks.forEach(callback => callback());
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onErrorCallbacks.forEach(callback => callback(error));
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        this.stopPingInterval();
        this.onDisconnectCallbacks.forEach(callback => callback());
        
        // Attempt to reconnect if not intentionally closed
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    this.isIntentionallyClosed = true;
    this.stopPingInterval();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.token && !this.isIntentionallyClosed) {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect(this.token);
      }
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval() {
    this.stopPingInterval();
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any) {
    switch (message.type) {
      case 'connected':
        console.log('WebSocket connection confirmed:', message.message);
        break;
      
      case 'notification':
        // New notification received
        this.onNotificationCallbacks.forEach(callback => callback(message.data));
        break;
      
      case 'pong':
        // Pong response to ping
        break;
      
      default:
        console.log('Unknown message type:', message);
    }
  }

  /**
   * Register callback for new notifications
   */
  onNotification(callback: NotificationCallback) {
    this.onNotificationCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.onNotificationCallbacks = this.onNotificationCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register callback for connection
   */
  onConnect(callback: ConnectionCallback) {
    this.onConnectCallbacks.push(callback);
    
    return () => {
      this.onConnectCallbacks = this.onConnectCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register callback for disconnection
   */
  onDisconnect(callback: ConnectionCallback) {
    this.onDisconnectCallbacks.push(callback);
    
    return () => {
      this.onDisconnectCallbacks = this.onDisconnectCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register callback for errors
   */
  onError(callback: ErrorCallback) {
    this.onErrorCallbacks.push(callback);
    
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Export singleton instance
export const notificationWebSocket = new NotificationWebSocketService();
