import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Bot } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { SamplePromptCards } from './SamplePromptCards';
import { ThinkingIndicator } from './ThinkingIndicator';
import { Message } from '@/hooks/useWebSocket';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isConnected: boolean;
  streamingMessage?: Message | null;
  isGenerating?: boolean;
}

export const ChatWindow = ({ messages, onSendMessage, isConnected, streamingMessage, isGenerating = false }: ChatWindowProps) => {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full py-8">
            <SamplePromptCards onSelectPrompt={handleSelectPrompt} />
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card px-6 py-4">
        <div className="flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            disabled={!isConnected || isSending}
            className="resize-none min-h-[60px] max-h-[200px]"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || !isConnected || isSending}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300 h-[60px] px-6"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
