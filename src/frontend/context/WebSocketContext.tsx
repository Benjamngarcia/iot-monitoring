import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface WebSocketContextType {
  isConnected: boolean;
  error: string | null;
  lastMessage: any | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  error: null,
  lastMessage: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<any | null>(null);

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  const connectWebSocket = () => {
    cleanup();

    try {
      const ws = new WebSocket('ws://localhost:4000');
      
      ws.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        setError(null);
        retryCountRef.current = 0; // Reset retry count on successful connection
      };

      ws.onclose = (event) => {
        console.log('WebSocket Disconnected', event.code, event.reason);
        setIsConnected(false);
        
        // Only attempt to reconnect if we haven't exceeded max retries
        if (retryCountRef.current < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${retryCountRef.current + 1}/${MAX_RETRIES})`);
          
          retryTimeoutRef.current = setTimeout(() => {
            retryCountRef.current += 1;
            connectWebSocket();
          }, delay);
        } else {
          setError('Maximum reconnection attempts reached. Please refresh the page.');
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket Error:', event);
        // Don't set error state here, let onclose handle reconnection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
          setError('Error processing data from server');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
      
      // Attempt to reconnect if we haven't exceeded max retries
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current);
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${retryCountRef.current + 1}/${MAX_RETRIES})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          retryCountRef.current += 1;
          connectWebSocket();
        }, delay);
      } else {
        setError('Maximum reconnection attempts reached. Please refresh the page.');
      }
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      cleanup();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, error, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}; 