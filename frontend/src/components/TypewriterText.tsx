import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // characters per second
  onComplete?: () => void;
}

export const TypewriterText = ({ text, speed = 50, onComplete }: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 1000 / speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex >= text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span>
      {displayedText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
};