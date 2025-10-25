import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export const ThinkingIndicator = () => {
  const thinkingMessages = [
    "Agent is thinking",
    "Analyzing your request",
    "Preparing response",
    "Processing information"
  ];
  
  const randomMessage = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3 mb-4"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-chat-assistant-bg flex items-center justify-center shadow-soft">
        <Bot className="w-5 h-5 text-chat-assistant-text" />
      </div>
      
      <div className="flex-1 bg-chat-assistant-bg rounded-2xl px-4 py-3 max-w-[70%] shadow-soft rounded-tl-sm">
        <div className="flex items-center gap-2">
          <span className="text-chat-assistant-text text-sm">{randomMessage}</span>
          <div className="flex gap-1">
            <motion.div
              className="w-1.5 h-1.5 bg-chat-assistant-text rounded-full opacity-60"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-chat-assistant-text rounded-full opacity-60"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />
            <motion.div
              className="w-1.5 h-1.5 bg-chat-assistant-text rounded-full opacity-60"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.8 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};