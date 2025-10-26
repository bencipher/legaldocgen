import { useState, useEffect } from 'react';
import { Message } from './useWebSocket';

export interface ConversationData {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
  documentContent: string;
  lastActivity: number;
}

export const useConversationManager = (userId: string) => {
  const conversationsKey = `conversations_${userId}`;
  const currentConversationKey = `current_conversation_${userId}`;
  
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentDocumentContent, setCurrentDocumentContent] = useState<string>('');
  const [isContentChanged, setIsContentChanged] = useState(false); // Track if content actually changed

  // Load conversations on mount (but don't auto-load current conversation)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(conversationsKey);
      const loadedConversations = stored ? JSON.parse(stored) : [];
      setConversations(loadedConversations);
      console.log(`Loaded ${loadedConversations.length} conversations`);
      
      // Start with a blank conversation instead of loading the last one
      startNewConversation();
    } catch (error) {
      console.error('Failed to load conversations from localStorage:', error);
      setConversations([]);
      startNewConversation();
    }
  }, []);

  // Save conversations whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(conversationsKey, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations to localStorage:', error);
    }
  }, [conversations, conversationsKey]);

  // Save current conversation data whenever it changes
  useEffect(() => {
    if (currentConversationId && (currentMessages.length > 0 || currentDocumentContent)) {
      saveCurrentConversation(isContentChanged); // Use the flag to determine if activity should update
      setIsContentChanged(false); // Reset the flag after saving
    }
  }, [currentMessages, currentDocumentContent, currentConversationId, isContentChanged]);

  const generateConversationTitle = (firstMessage: string): string => {
    // Extract key words from first message to create title
    const words = firstMessage.toLowerCase().split(' ').filter(word => 
      ['agreement', 'contract', 'lease', 'rental', 'employment', 'nda', 'privacy', 'terms', 'service'].includes(word)
    );
    if (words.length > 0) {
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Document';
    }
    // Fallback to first few words
    return firstMessage.split(' ').slice(0, 3).join(' ') + (firstMessage.split(' ').length > 3 ? '...' : '');
  };

  const saveCurrentConversation = (updateActivity = true) => {
    if (!currentConversationId) return;

    setConversations(prev => {
      const existingIndex = prev.findIndex(c => c.id === currentConversationId);
      const title = currentMessages.length > 0 
        ? generateConversationTitle(currentMessages[0].content)
        : 'New Conversation';

      const existing = prev[existingIndex];
      const conversationData: ConversationData = {
        id: currentConversationId,
        title,
        timestamp: currentMessages[0]?.timestamp || Date.now(),
        messages: currentMessages,
        documentContent: currentDocumentContent,
        // Only update lastActivity if explicitly requested (when content actually changes)
        lastActivity: updateActivity ? Date.now() : (existing?.lastActivity || Date.now())
      };

      if (existingIndex >= 0) {
        // Update existing conversation
        const updated = [...prev];
        updated[existingIndex] = conversationData;
        return updated;
      } else {
        // Add new conversation
        return [conversationData, ...prev];
      }
    });
  };

  const startNewConversation = () => {
    const newId = `conversation-${Date.now()}`;
    setCurrentConversationId(newId);
    setCurrentMessages([]);
    setCurrentDocumentContent('');
    setIsContentChanged(false); // Reset flag for new conversation
  };

  const switchToConversation = (id: string) => {
    // Save current conversation before switching (without updating activity)
    if (currentConversationId && (currentMessages.length > 0 || currentDocumentContent)) {
      saveCurrentConversation(false); // Don't update lastActivity when just switching
    }

    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setCurrentConversationId(id);
      setCurrentMessages(conversation.messages);
      setCurrentDocumentContent(conversation.documentContent);
      setIsContentChanged(false); // Reset flag when switching - this is not new content
      return {
        messages: conversation.messages,
        documentContent: conversation.documentContent
      };
    }
    return null;
  };

  const addMessage = (message: Message) => {
    const messageWithTimestamp = { ...message, timestamp: Date.now() };
    setCurrentMessages(prev => [...prev, messageWithTimestamp]);
    setIsContentChanged(true); // Mark that content actually changed
  };

  const updateDocumentContent = (content: string) => {
    setCurrentDocumentContent(content);
    setIsContentChanged(true); // Mark that content actually changed
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    
    // If deleting current conversation, start a new one
    if (id === currentConversationId) {
      startNewConversation();
    }
  };

  const clearCurrentSession = () => {
    // Clear everything - current session and all conversation history
    setCurrentMessages([]);
    setCurrentDocumentContent('');
    setConversations([]); // Clear all conversation history
    // Start fresh with a new conversation ID
    setCurrentConversationId(`conversation-${Date.now()}`);
  };

  // Get conversations for sidebar (sorted by last activity)
  const getConversationsList = () => {
    return conversations
      .filter(c => c.messages.length > 0) // Only show conversations with messages
      .sort((a, b) => b.lastActivity - a.lastActivity);
  };

  return {
    // Current conversation state
    currentConversationId,
    messages: currentMessages,
    documentContent: currentDocumentContent,
    
    // Conversation management
    conversations: getConversationsList(),
    startNewConversation,
    switchToConversation,
    deleteConversation,
    
    // Content management
    addMessage,
    updateDocumentContent,
    clearCurrentSession,
    
    // Utils
    getCurrentConversationTitle: () => {
      if (currentMessages.length === 0) return 'New Conversation';
      return generateConversationTitle(currentMessages[0].content);
    }
  };
};