import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Bot, Square } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { SamplePromptCards } from './SamplePromptCards';
import { ThinkingIndicator } from './ThinkingIndicator';
import { Message } from '@/hooks/useWebSocket';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onStopGeneration?: () => void;
  isConnected: boolean;
  streamingMessage?: Message | null;
  isGenerating?: boolean;
  documentContent?: string;
  isReconnecting?: boolean;
}

export const ChatWindow = ({ 
  messages, 
  onSendMessage, 
  onStopGeneration,
  isConnected, 
  streamingMessage, 
  isGenerating = false,
  documentContent,
  isReconnecting = false 
}: ChatWindowProps) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_RETRY_ATTEMPTS = 2;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Detect when a new assistant message arrives
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && isThinking) {
      setIsThinking(false);
      setTypingMessageIndex(messages.length - 1);
    }
  }, [messages, isThinking]);

  const handleSend = () => {
    if (!input.trim() || !isConnected || isSending) return;

    setIsSending(true);
    setIsThinking(true);
    setTypingMessageIndex(null);
    onSendMessage(input.trim());
    setInput('');
    
    setTimeout(() => setIsSending(false), 500);
    textareaRef.current?.focus();
  };

  const handleStopGeneration = () => {
    if (onStopGeneration) {
      onStopGeneration();
    }
  };

  const handleResumeGeneration = () => {
    if (retryCount < MAX_RETRY_ATTEMPTS) {
      setRetryCount(prev => prev + 1);
      onSendMessage('Please continue the document generation from where we left off.');
    }
  };

  const handleTypingComplete = () => {
    setTypingMessageIndex(null);
    setIsThinking(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area with Sample Cards */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col">
            {/* Sample Cards - takes most space but leaves room for input */}
            <div className="flex-1 px-3 sm:px-6 py-4 sm:py-6 overflow-y-auto">
              <div className="max-h-full">
                <SamplePromptCards onSelectPrompt={handleSelectPrompt} />
              </div>
            </div>
            {/* Empty state message at bottom */}
            <div className="px-3 sm:px-6 py-2 text-center">
              <div className="text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Choose a template above or type your message below to get started.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-3 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
            {messages.map((message, index) => (
              <MessageBubble 
                key={index} 
                message={message} 
                index={index}
                isTyping={typingMessageIndex === index}
                onTypingComplete={handleTypingComplete}
              />
            ))}
            
            {/* Show thinking indicator */}
            {isThinking && !isGenerating && <ThinkingIndicator />}
            
            {/* Show simple streaming message during generation */}
            {streamingMessage && isGenerating && (
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-chat-assistant-bg text-chat-assistant-text flex items-center justify-center shadow-soft">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1 max-w-[70%] bg-chat-assistant-bg text-chat-assistant-text rounded-2xl px-4 py-3 shadow-soft rounded-tl-sm">
                  <p className="text-sm leading-relaxed text-accent">
                    🎬 Generating document... Switch to Preview tab to see live progress.
                  </p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card px-3 sm:px-6 py-3 sm:py-4">
        {/* Resume Generation Button - shows when reconnected and has partial content */}
        {isConnected && !isGenerating && documentContent && documentContent.length > 100 && retryCount < MAX_RETRY_ATTEMPTS && (
          <div className="mb-3 p-2 sm:p-3 bg-muted/50 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-300">
                  Document generation was interrupted
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Click to resume from where you left off (Attempt {retryCount + 1}/{MAX_RETRY_ATTEMPTS + 1})
                </p>
              </div>
              <Button
                onClick={handleResumeGeneration}
                variant="outline"
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950 w-full sm:w-auto text-xs sm:text-sm"
              >
                Resume Generation
              </Button>
            </div>
          </div>
        )}

        {/* Max retry attempts reached */}
        {isConnected && !isGenerating && documentContent && documentContent.length > 100 && retryCount >= MAX_RETRY_ATTEMPTS && (
          <div className="mb-3 p-2 sm:p-3 bg-red-50 rounded-lg border border-red-200 dark:bg-red-950 dark:border-red-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-300">
                  Maximum retry attempts reached
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Please start a new document generation or try a different prompt
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 sm:gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            disabled={!isConnected || isSending || isGenerating}
            className="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm sm:text-base"
            rows={1}
          />
          
          {/* Show Stop button during generation, Send button otherwise */}
          {isGenerating ? (
            <Button
              onClick={handleStopGeneration}
              variant="destructive"
              className="gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base"
              size="sm"
            >
              <Square className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Stop</span>
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!isConnected || !input.trim() || isSending}
              className="gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base"
              size="sm"
            >
              {isSending ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              <span className="hidden sm:inline">Send</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
