import { useState, useEffect } from 'react';
import { Message } from './useWebSocket';

export const useLocalStorage = (userId: string, projectName: string) => {
  const storageKey = `conversation_${userId}_${projectName}`;
  
  const [messages, setMessages] = useState<Message[]>([]);

  // Load messages whenever the storage key changes (conversation switch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const loadedMessages = stored ? JSON.parse(stored) : [];
      setMessages(loadedMessages);
      console.log(`Loaded ${loadedMessages.length} messages for conversation:`, projectName);
    } catch (error) {
      console.error('Failed to load messages from localStorage:', error);
      setMessages([]);
    }
  }, [storageKey, projectName]);

  // Save messages whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save messages to localStorage:', error);
    }
  }, [messages, storageKey]);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, { ...message, timestamp: Date.now() }]);
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem(storageKey);
  };

  return {
    messages,
    addMessage,
    clearMessages,
  };
};
