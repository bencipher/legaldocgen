import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket, Message, WebSocketMessage } from '@/hooks/useWebSocket';
import { useConversationManager } from '@/hooks/useConversationManager';
import { ChatWindow } from './ChatWindow';
import { ConversationHistorySidebar } from './ConversationHistorySidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Lazy load the heavy PreviewPane component
const PreviewPane = lazy(() => import('./PreviewPane'));

interface AssistantPageProps {
  wsUrl: string;
  userId: string;
  projectName: string;
  theme?: 'light' | 'dark';
  onDocumentGenerated?: (html: string) => void;
}

type TabType = 'chat' | 'preview';

export const AssistantPage = ({
  wsUrl,
  userId,
  projectName,
  theme = 'light',
  onDocumentGenerated,
}: AssistantPageProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerationStarting, setIsGenerationStarting] = useState(false);
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  
  // Use the new conversation manager
  const {
    currentConversationId,
    messages,
    documentContent,
    conversations,
    startNewConversation,
    switchToConversation,
    deleteConversation,
    addMessage,
    updateDocumentContent,
    clearCurrentSession,
    getCurrentConversationTitle
  } = useConversationManager(userId);

  const handleNewConversation = () => {
    // Prevent creating new conversation during generation
    if (isGenerating) {
      toast({
        title: 'Generation in Progress',
        description: 'Please wait for the current document generation to complete before starting a new conversation.',
        variant: 'destructive'
      });
      return;
    }

    startNewConversation();
    setIsGenerating(false);
    setIsGenerationStarting(false);
    setIsGenerationComplete(false); // Reset completion status for new conversation
    setIsChatEnded(false); // Reset chat ended status for new conversation
    setStreamingMessage(null);
    setActiveTab('chat');
    
    toast({
      title: 'New Conversation',
      description: 'Started a new conversation.',
    });
  };

  const handleClearSession = () => {
    // Prevent clearing session during generation
    if (isGenerating) {
      toast({
        title: 'Generation in Progress',
        description: 'Please wait for the current document generation to complete before clearing the session.',
        variant: 'destructive'
      });
      return;
    }

    clearCurrentSession();
    setIsGenerating(false);
    setIsGenerationStarting(false);
    setIsGenerationComplete(false);
    setIsChatEnded(false); // Reset chat ended status when clearing session
    setStreamingMessage(null);
    setActiveTab('chat');
    
    // Clear ALL backend orchestrator objects
    resetAllSessions();
    
    toast({
      title: 'Session Cleared',
      description: 'All messages and generated content have been cleared.',
    });
  };

  const handleWebSocketMessage = (data: WebSocketMessage) => {
    switch (data.type) {
      case 'user_message':
        if (data.content) {
          addMessage({ role: 'user', content: data.content });
        }
        break;

      case 'assistant_message':
        if (data.content) {
          addMessage({ role: 'assistant', content: data.content });
          
          // Check if this message indicates generation is about to start
          if (data.content.includes('Generating your document') || 
              data.content.includes('I have all the info I need')) {
            setIsGenerationStarting(true);
            setActiveTab('preview');
            
            // Show starting animation for a moment
            setTimeout(() => {
              setIsGenerationStarting(false);
            }, 2000);
          }
        }
        break;

      case 'system_message':
        // Don't add system messages to chat - they clutter the interface
        // Connection status is already shown in the header
        break;

      case 'generate_document': {
        setIsGenerating(true);
        setIsGenerationComplete(false); // Reset completion status when starting new generation
        if (data.chunk) {
          const newContent = documentContent + data.chunk;
          updateDocumentContent(newContent);
          
          // Create or update streaming message for typewriter effect
          if (!streamingMessage) {
            const newStreamingMessage: Message = {
              role: 'assistant',
              content: data.chunk,
              timestamp: Date.now()
            };
            setStreamingMessage(newStreamingMessage);
          } else {
            setStreamingMessage(prev => prev ? {
              ...prev,
              content: prev.content + data.chunk
            } : null);
          }
        }
        break;
      }

      case 'generation_complete': {
        setIsGenerating(false);
        setIsGenerationComplete(true);
        
        // Add the complete document as a final message
        if (streamingMessage) {
          addMessage(streamingMessage);
          setStreamingMessage(null);
        }
        
        // Update with final document if provided
        if (data.full_document) {
          updateDocumentContent(data.full_document);
        }
        
        // Check if document seems incomplete for user feedback
        const finalContent = data.full_document || documentContent;
        const isIncomplete = finalContent.length < 5000 || // Less than ~5 pages
                            !finalContent.toLowerCase().includes('signature') ||
                            finalContent.trim().endsWith('...');
        
        if (isIncomplete) {
          toast({
            title: 'Document Generated',
            description: 'Document completed. If it seems incomplete, you can type "continue" to extend it.',
            duration: 5000,
          });
        } else {
          toast({
            title: 'Document Generated',
            description: 'Your comprehensive document is ready for review and export.',
          });
        }
        
        if (documentContent) {
          onDocumentGenerated?.(documentContent);
        }
        break;
      }
      
      case 'all_sessions_reset': {
        // Backend has confirmed all sessions have been cleared
        toast({
          title: 'Sessions Cleared',
          description: 'All conversation sessions have been successfully cleared.',
          variant: 'default'
        });
        break;
      }
      
      case 'chat_ended': {
        // Chat has ended after successful generation
        setIsChatEnded(true);
        addMessage({ role: 'system', content: data.content || 'Chat ended.' });
        
        // Automatically switch to preview tab to show the completed document
        setActiveTab('preview');
        
        toast({
          title: 'Document Complete!',
          description: 'Your document has been generated successfully. Check the Preview tab.',
          variant: 'default'
        });
        break;
      }
    }
  };

  const { isConnected, isReconnecting, sendMessage, resetAllSessions } = useWebSocket({
    url: wsUrl,
    onMessage: handleWebSocketMessage,
    onOpen: () => {
      // Show toast only briefly, don't clutter chat
      toast({
        title: 'Connected',
        description: 'Successfully connected to the assistant.',
        duration: 2000,
      });
      
      // If we were generating content before disconnection, try to resume
      if (isGenerating && documentContent) {
        toast({
          title: 'Resuming Generation',
          description: 'Attempting to continue document generation...',
          duration: 3000,
        });
        
        // Send a resume message to continue generation
        setTimeout(() => {
          sendMessage({
            type: 'user_message',
            content: 'Please continue the document generation from where we left off.',
            conversation_id: currentConversationId
          });
        }, 1000);
      }
    },
    onClose: () => {
      toast({
        title: 'Disconnected',
        description: 'Connection lost. Will attempt to reconnect...',
        variant: 'destructive',
        duration: 3000,
      });
    },
    onError: () => {
      toast({
        title: 'Connection Error',
        description: 'WebSocket connection failed. Retrying...',
        variant: 'destructive',
        duration: 2000,
      });
    },
  });

  const handleSendMessage = (content: string) => {
    const message: Message = { role: 'user', content };
    addMessage(message);
    
    sendMessage({
      type: 'user_message',
      content,
      conversation_id: currentConversationId, // Add conversation ID
    });
  };

  const handleStopGeneration = () => {
    // Send stop signal to backend
    sendMessage({
      type: 'stop_generation',
      conversation_id: currentConversationId,
    });
    
    // Reset frontend state
    setIsGenerating(false);
    setIsGenerationStarting(false);
    setStreamingMessage(null);
  };

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        {/* Conversation History Sidebar */}
        <ConversationHistorySidebar
          conversations={conversations}
          activeConversationId={currentConversationId}
          isGenerating={isGenerating}
          onSelectConversation={(id) => {
            // Prevent switching conversations during generation
            if (isGenerating) {
              toast({
                title: 'Generation in Progress',
                description: 'Please wait for the current document generation to complete before switching conversations.',
                variant: 'destructive'
              });
              return;
            }

            const result = switchToConversation(id);
            if (result) {
              // Successfully switched - restore document content and set active tab
              setActiveTab(result.documentContent ? 'preview' : 'chat');
            }
            // IMPORTANT: Reset all streaming/animation states when switching conversations
            setIsGenerating(false);
            setIsGenerationStarting(false);
            setIsGenerationComplete(false);
            setIsChatEnded(false); // Reset chat ended status when switching conversations
            setStreamingMessage(null);
            
            // Notify backend about conversation switch
            sendMessage({
              type: 'switch_conversation',
              conversation_id: id,
            });

            toast({
              title: 'Conversation Selected',
              description: `Switched to conversation`,
              duration: 1500,
            });
          }}
          onDeleteConversation={(id) => {
            // Prevent deleting conversations during generation
            if (isGenerating) {
              toast({
                title: 'Generation in Progress',
                description: 'Please wait for the current document generation to complete before deleting conversations.',
                variant: 'destructive'
              });
              return;
            }

            deleteConversation(id);
            toast({
              title: 'Conversation Deleted',
              description: 'Conversation has been removed.',
            });
          }}
          onNewConversation={handleNewConversation}
        />

        {/* Main Content */}
        <div className="flex flex-col flex-1 h-screen min-w-0 overflow-hidden">
          {/* Header */}
          <header className="border-b border-border bg-card shadow-soft">
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                    {projectName}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                    {getCurrentConversationTitle()}
                  </p>
                </div>

                {/* Connection Status and Clear Button */}
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  {isConnected ? (
                    <div className="flex items-center gap-1 sm:gap-2 text-accent">
                      <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm font-medium hidden sm:inline">Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 sm:gap-2 text-destructive">
                      <WifiOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm font-medium hidden sm:inline">
                        {isReconnecting ? 'Reconnecting...' : 'Disconnected'}
                      </span>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handleClearSession}
                    className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                    size="sm"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Clear Session</span>
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4 sm:mt-6">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 sm:py-3 rounded-t-lg font-medium transition-all duration-300 text-sm sm:text-base ${
                    activeTab === 'chat'
                      ? 'bg-background text-foreground shadow-soft'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 sm:py-3 rounded-t-lg font-medium transition-all duration-300 text-sm sm:text-base ${
                    activeTab === 'preview'
                      ? 'bg-background text-foreground shadow-soft'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <span className="hidden sm:inline">Document </span>Preview
                  {(isGenerating || isGenerationStarting) && (
                    <span className="ml-1 sm:ml-2 inline-block w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'chat' ? (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <ChatWindow
                    key={currentConversationId} // Force remount on conversation change
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onStopGeneration={handleStopGeneration}
                    isConnected={isConnected}
                    streamingMessage={streamingMessage}
                    isGenerating={isGenerating}
                    documentContent={documentContent}
                    isReconnecting={isReconnecting}
                    isGenerationComplete={isGenerationComplete}
                    isChatEnded={isChatEnded}
                    onStartNewDocument={handleNewConversation}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Suspense fallback={
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  }>
                    <PreviewPane
                      content={documentContent}
                      isGenerating={isGenerating}
                      isGenerationStarting={isGenerationStarting}
                      onBackToChat={() => setActiveTab('chat')}
                    />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};
