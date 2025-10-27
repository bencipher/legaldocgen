import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface TypewriterMarkdownProps {
  content: string;
  isStreaming: boolean;
  speed?: number; // characters per second
}

export const TypewriterMarkdown = ({ content, isStreaming, speed = 300 }: TypewriterMarkdownProps) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasContentStarted, setHasContentStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [targetContent, setTargetContent] = useState(''); // The content we're typing towards
  const contentRef = useRef<HTMLDivElement>(null);
  // COMMENTED OUT: lastScrollHeight not needed since auto-scroll removed
  // const lastScrollHeight = useRef(0);

  // COMMENTED OUT: Old content started logic - moved to new effect below
  // useEffect(() => {
  //   const trimmedContent = content.trim();
  //   // Only consider it "started" if we have substantial content (more than just a few characters)
  //   if (trimmedContent.length > 10 && !hasContentStarted) {
  //     setHasContentStarted(true);
  //   }
  //   // Reset if content becomes empty (new generation starting)
  //   if (trimmedContent.length === 0 && hasContentStarted) {
  //     setHasContentStarted(false);
  //   }
  // }, [content, hasContentStarted]);

  // Calculate scroll progress and page numbers
  const handleScroll = () => {
    if (contentRef.current) {
      const element = contentRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      
      // Calculate scroll progress (0-100)
      const progress = scrollHeight > clientHeight 
        ? (scrollTop / (scrollHeight - clientHeight)) * 100
        : 100;
      setScrollProgress(Math.round(progress));
      
      // Calculate page numbers based on actual content height and standard page size
      // Using A4 proportions: ~1100px height represents a standard page
      const pageHeight = 1100; // More realistic page height for document content
      const totalPagesCalc = Math.max(1, Math.ceil(scrollHeight / pageHeight));
      const currentPageCalc = Math.max(1, Math.min(
        Math.ceil((scrollTop + clientHeight / 2) / pageHeight), 
        totalPagesCalc
      ));
      
      setTotalPages(totalPagesCalc);
      setCurrentPage(currentPageCalc);
    }
  };

  // Add scroll listener
  useEffect(() => {
    const element = contentRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      // Initial calculation
      handleScroll();
      
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [hasContentStarted]);

  // Fullscreen toggle handlers
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Auto-enter fullscreen when streaming starts (but allow user override)
  // COMMENTED OUT: Auto-fullscreen behavior removed per user request
  // useEffect(() => {
  //   if (isStreaming && hasContentStarted && !isFullscreen) {
  //     setIsFullscreen(true);
  //   }
  //   // Don't force fullscreen back on if user manually exited
  // }, [isStreaming, hasContentStarted]); // Removed isFullscreen dependency to allow user exit

  // Update target content when new content arrives - NEVER RESTART, ONLY CONTINUE (FIXED v2)
  useEffect(() => {
    if (content) {
      const cleanedContent = cleanContentForDisplay(content);
      
      // Always set target content
      setTargetContent(cleanedContent);
      
      // If this is the first time we're getting content
      if (!hasContentStarted && cleanedContent.length > 10) {
        setHasContentStarted(true);
        setCurrentIndex(0);
        setDisplayedContent('');
      }
      // If content is growing and we're already typing, the typewriter will automatically catch up
      // due to the targetContent.length dependency in the typewriter effect
    }
  }, [content, hasContentStarted]);

  // Typewriter effect - continuously type towards target content (STABLE VERSION)
  useEffect(() => {
    if (!isStreaming || !targetContent || !hasContentStarted) return;
    if (currentIndex >= targetContent.length) return; // Already finished

    const timeoutId = setTimeout(() => {
      const newIndex = currentIndex + 1;
      const newDisplayed = targetContent.slice(0, newIndex);
      setDisplayedContent(newDisplayed);
      setCurrentIndex(newIndex);
    }, 1000 / speed);

    return () => clearTimeout(timeoutId);
  }, [currentIndex, targetContent.length, isStreaming, hasContentStarted, speed]);

  // Reset when content changes significantly or streaming starts
  useEffect(() => {
    if (!content) {
      setCurrentIndex(0);
      setDisplayedContent('');
      setHasContentStarted(false);
      setTargetContent(''); // Reset target content
      // COMMENTED OUT: lastScrollHeight not needed since auto-scroll removed
      // lastScrollHeight.current = 0;
    }
  }, [content]);

  // Clean content for display (remove page break markers and normalize content)
  const cleanContentForDisplay = (rawContent: string) => {
    return rawContent
      .replace(/---PAGE_BREAK---\s*/g, '') // Remove page break markers
      .replace(/^\s*---\s*$/gm, '') // Remove standalone --- lines
      .replace(/\n{3,}/g, '\n\n') // Normalize excessive line breaks
      .replace(/\r\n/g, '\n') // Normalize line endings
      .trim(); // Remove leading/trailing whitespace
  };

  // When streaming stops, show full content immediately
  useEffect(() => {
    if (!isStreaming && content) {
      const cleanedContent = cleanContentForDisplay(content);
      setDisplayedContent(cleanedContent);
      setCurrentIndex(cleanedContent.length);
      setTargetContent(cleanedContent); // Update target to match final content
    }
  }, [isStreaming, content]);

  // Show loader while waiting for content to start OR when streaming but no content yet
  if (isStreaming && !hasContentStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-64 text-center"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-primary flex items-center justify-center mb-4 sm:mb-6 shadow-glow">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold mb-2 bg-gradient-primary bg-clip-text text-transparent">
          Generating Content...
        </h3>
        <p className="text-sm text-muted-foreground max-w-md px-4">
          Please wait while your document is being created...
        </p>
        <div className="flex gap-2 mt-4">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Document Header - Only show when content exists */}
      {hasContentStarted && (
        <div className={`flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg border ${isFullscreen ? 'm-4' : ''}`}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Document Preview</span>
            {isStreaming && (
              <span className="text-xs text-accent font-medium animate-pulse flex items-center gap-1">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                Live Generation
              </span>
            )}
            {/* COMMENTED OUT: Auto fullscreen text removed per user request */}
            {/* {isFullscreen && isStreaming && (
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                • Auto Fullscreen
                <span className="text-xs text-muted-foreground">(Press Esc to exit)</span>
              </span>
            )} */}
          </div>
          
          {/* Page indicator and progress */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Page {currentPage} of {totalPages}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {scrollProgress}%
            </div>
            {isFullscreen && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0"
                title="Exit Fullscreen (works during generation)"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Document Content - Single scrollable view */}
      <div className={`relative flex-1 min-h-0 ${isFullscreen ? 'h-[calc(100vh-8rem)]' : ''}`}>
        <div 
          ref={contentRef}
          className={`w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-muted/20 hover:scrollbar-thumb-muted-foreground/50 transition-colors ${
            isFullscreen 
              ? 'mx-4 mb-16' 
              : 'mb-8'
          }`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgb(100 116 139 / 0.3) rgb(100 116 139 / 0.1)'
          }}
        >
          <div
            className={`prose prose-slate dark:prose-invert max-w-none
                       prose-headings:text-foreground prose-p:text-foreground 
                       prose-strong:text-foreground prose-li:text-foreground
                       prose-a:text-primary prose-a:decoration-primary/50 hover:prose-a:decoration-primary
                       prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary
                       prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded
                       prose-pre:bg-muted prose-pre:border
                       prose-table:text-sm prose-th:bg-muted
                       prose-hr:border-border
                       bg-card rounded-lg border shadow-sm
                       min-h-[400px] page-content
                       prose-sm sm:prose-base ${
                         isFullscreen 
                           ? 'p-8 mx-auto max-w-4xl' 
                           : 'p-3 sm:p-6'
                       }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom styling for various markdown elements
                h1: ({ children }) => (
                  <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 pb-2 border-b border-border">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg sm:text-2xl font-semibold mt-6 sm:mt-8 mb-3 sm:mb-4 text-primary">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base sm:text-xl font-medium mt-4 sm:mt-6 mb-2 sm:mb-3">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 sm:mb-4 leading-relaxed text-foreground text-sm sm:text-base">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 sm:mb-4 ml-4 sm:ml-6 list-disc space-y-1 sm:space-y-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 sm:mb-4 ml-4 sm:ml-6 list-decimal space-y-1 sm:space-y-2">
                    {children}
                  </ol>
                ),
                a: ({ children, href }) => (
                  <a 
                    href={href} 
                    className="text-primary hover:text-primary/80 underline decoration-primary/50 hover:decoration-primary transition-colors"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary bg-muted/50 pl-3 sm:pl-4 py-2 my-3 sm:my-4 italic text-sm sm:text-base">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 sm:my-6">
                    <table className="w-full border-collapse border border-border rounded-lg text-xs sm:text-sm">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-border bg-muted px-2 sm:px-4 py-1 sm:py-2 text-left font-semibold text-xs sm:text-sm">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm">
                    {children}
                  </td>
                )
              }}
            >
              {displayedContent}
            </ReactMarkdown>
            
            {/* Typewriter cursor */}
            {isStreaming && hasContentStarted && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                className="inline-block w-2 h-4 bg-primary ml-1"
              />
            )}
          </div>
        </div>

        {/* Fullscreen toggle button - bottom right */}
        {hasContentStarted && !isFullscreen && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="absolute bottom-4 right-4 h-10 w-10 p-0 shadow-lg bg-background/90 backdrop-blur-sm hover:bg-background border-border/50"
            title="Enter Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Default export for lazy loading compatibility
export default TypewriterMarkdown;