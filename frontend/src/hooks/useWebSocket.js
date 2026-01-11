import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState(new Set());
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:3001';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('message', (data) => {
      setMessages((prev) => [...prev.slice(-49), data]); // Keep last 50 messages
    });

    newSocket.on('newBlock', (data) => {
      setMessages((prev) => [...prev.slice(-49), { type: 'newBlock', ...data }]);
    });

    newSocket.on('newTransaction', (data) => {
      setMessages((prev) => [...prev.slice(-49), { type: 'newTransaction', ...data }]);
    });

    newSocket.on('systemAlert', (data) => {
      setMessages((prev) => [...prev.slice(-49), { type: 'systemAlert', ...data }]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const subscribe = useCallback(
    (channel) => {
      if (socket && connected) {
        socket.emit('subscribe', { channel });
        setSubscriptions((prev) => new Set([...prev, channel]));
      }
    },
    [socket, connected]
  );

  const unsubscribe = useCallback(
    (channel) => {
      if (socket && connected) {
        socket.emit('unsubscribe', { channel });
        setSubscriptions((prev) => {
          const newSubs = new Set(prev);
          newSubs.delete(channel);
          return newSubs;
        });
      }
    },
    [socket, connected]
  );

  const sendMessage = useCallback(
    (type, data) => {
      if (socket && connected) {
        socket.emit(type, data);
      }
    },
    [socket, connected]
  );

  const value = {
    socket,
    connected,
    subscriptions,
    messages,
    subscribe,
    unsubscribe,
    sendMessage
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};
