import { motion } from 'framer-motion';
import { Bot, User, AlertCircle } from 'lucide-react';
import { Message } from '@/hooks/useWebSocket';
import { TypewriterText } from './TypewriterText';

interface MessageBubbleProps {
  message: Message;
  index: number;
  isTyping?: boolean;
  onTypingComplete?: () => void;
}

export const MessageBubble = ({ message, index, isTyping = false, onTypingComplete }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const getBgColor = () => {
    if (isUser) return 'bg-chat-user-bg';
    if (isSystem) return 'bg-chat-system-bg';
    return 'bg-chat-assistant-bg';
  };

  const getTextColor = () => {
    if (isUser) return 'text-chat-user-text';
    if (isSystem) return 'text-chat-system-text';
    return 'text-chat-assistant-text';
  };

  const getIcon = () => {
    if (isUser) return <User className="w-5 h-5" />;
    if (isSystem) return <AlertCircle className="w-5 h-5" />;
    return <Bot className="w-5 h-5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full ${getBgColor()} ${getTextColor()} flex items-center justify-center shadow-soft`}
      >
        {getIcon()}
      </div>
      
      {/* Always use regular chat bubble for messages in chat window */}
      <div
        className={`flex-1 max-w-[70%] ${getBgColor()} ${getTextColor()} rounded-2xl px-4 py-3 shadow-soft ${
          isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {isTyping && message.role === 'assistant' ? (
            <TypewriterText 
              text={message.content}
              speed={100}
              onComplete={onTypingComplete}
            />
          ) : (
            message.content
          )}
        </p>
        {message.timestamp && (
          <p className="text-xs opacity-60 mt-2">
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </motion.div>
  );
};
