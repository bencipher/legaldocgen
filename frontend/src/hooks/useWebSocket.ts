import { useEffect, useRef, useState } from 'react';

export type MessageType = 'user_message' | 'assistant_message' | 'system_message' | 'generate_document' | 'generation_complete' | 'switch_conversation' | 'conversation_switched' | 'stop_generation' | 'ping' | 'pong';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface WebSocketMessage {
  type: MessageType;
  content?: string;
  chunk?: string;
  chunk_index?: number;
  full_document?: string;
  conversation_id?: string;
}

interface UseWebSocketProps {
  url: string;
  onMessage: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = ({ url, onMessage, onOpen, onClose, onError }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectDelay = 30000; // 30 seconds
  const maxReconnectAttempts = 10; // Limit reconnection attempts
  const heartbeatRef = useRef<NodeJS.Timeout>();

  const sendHeartbeat = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  };

  const startHeartbeat = () => {
    // Send heartbeat every 30 seconds to keep connection alive
    heartbeatRef.current = setInterval(sendHeartbeat, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }
  };

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Prevent excessive reconnection attempts
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached. Please refresh the page.');
      setIsReconnecting(false);
      return;
    }

    console.log('Connecting to WebSocket:', url);
    const ws = new WebSocket(url);

    // Set a connection timeout
    const connectionTimeout = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.error('WebSocket connection timeout');
        ws.close();
      }
    }, 10000); // 10 second timeout

    ws.onopen = () => {
      console.log('WebSocket connected');
      clearTimeout(connectionTimeout);
      setIsConnected(true);
      setIsReconnecting(false);
      reconnectAttempts.current = 0;
      startHeartbeat();
      onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        // Handle heartbeat responses
        if (data.type === 'pong') {
          return; // Just acknowledge the heartbeat
        }
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
      clearTimeout(connectionTimeout);
      setIsConnected(false);
      stopHeartbeat();
      onClose?.();
      
      // Only reconnect if it wasn't a normal closure and we haven't exceeded attempts
      if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), maxReconnectDelay);
        console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
        setIsReconnecting(true);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      } else {
        setIsReconnecting(false);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      clearTimeout(connectionTimeout);
      onError?.(error);
    };

    wsRef.current = ws;
  };

  const disconnect = () => {
    stopHeartbeat();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect'); // Normal closure
      wsRef.current = null;
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.error('WebSocket is not connected. State:', wsRef.current?.readyState);
      return false;
    }
  };

  useEffect(() => {
    connect();
    return () => disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return {
    isConnected,
    isReconnecting,
    sendMessage,
    reconnect: connect,
    reconnectAttempts: reconnectAttempts.current,
    maxReconnectAttempts,
  };
};
