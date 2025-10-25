import { useEffect, useRef, useState } from 'react';

export type MessageType = 'user_message' | 'assistant_message' | 'system_message' | 'generate_document' | 'generation_complete' | 'switch_conversation' | 'conversation_switched';

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

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('Connecting to WebSocket:', url);
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setIsReconnecting(false);
      reconnectAttempts.current = 0;
      onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        console.log('WebSocket message received:', data);
        onMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      onClose?.();
      
      // Attempt to reconnect with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), maxReconnectDelay);
      console.log(`Reconnecting in ${delay}ms...`);
      setIsReconnecting(true);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttempts.current++;
        connect();
      }, delay);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError?.(error);
    };

    wsRef.current = ws;
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket message:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
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
  };
};
