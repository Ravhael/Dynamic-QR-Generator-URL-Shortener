class RealtimeService {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(data?: unknown) => void>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private token: string | null = null;

  connect(token: string) {
    this.token = token;
    
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      // Create URL with token as query parameter since EventSource doesn't support headers
      // Use main backend server for real-time updates
      const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';
      const url = `${baseUrl}/api/realtime/activity-stream?token=${token}`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.warn('📡 Real-time activity stream connected');
        this.emit('connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.warn('📨 Real-time update received:', data.type);
          
          if (data.type === 'activity-update') {
            this.emit('activity-update', data.activity);
          } else if (data.type === 'connected') {
            this.emit('connected');
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ SSE connection _error:', error);
        this.emit('error', error);
        
        if (this.shouldReconnect && !this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            if (this.shouldReconnect && this.token) {
              console.warn('🔄 Attempting to reconnect SSE...');
              this.connect(this.token);
            }
          }, 5000);
        }
      };

    } catch (err) {
      console.error('Failed to establish SSE connection:', err);
      this.emit('error', err);
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.warn('📡 Real-time activity stream disconnected');
    }
  }

  on(event: string, callback: (data?: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in ${event} callback:`, err);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

export const realtimeService = new RealtimeService();
