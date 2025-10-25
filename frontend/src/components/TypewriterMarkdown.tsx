import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface TypewriterMarkdownProps {
  content: string;
  isStreaming: boolean;
  speed?: number; // characters per second
}

export const TypewriterMarkdown = ({ content, isStreaming, speed = 50 }: TypewriterMarkdownProps) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Split content into pages based on PAGE_BREAK markers
  useEffect(() => {
    if (content) {
      const pageArray = content.split('---PAGE_BREAK---').map(page => page.trim()).filter(page => page);
      setPages(pageArray);
      
      // Auto-scroll to last page during streaming (where new content appears)
      if (isStreaming && pageArray.length > 0) {
        const newLastPageIndex = pageArray.length - 1;
        if (newLastPageIndex !== currentPage) {
          setCurrentPage(newLastPageIndex);
        }
      } else if (pageArray.length > 0 && currentPage >= pageArray.length) {
        setCurrentPage(0);
      }
    }
  }, [content, isStreaming, currentPage]);

  // Auto-navigate to page with new content during streaming
  useEffect(() => {
    if (isStreaming && pages.length > 0) {
      // Find the page that has the most recent content
      const contentLength = content.length;
      let totalLength = 0;
      let targetPage = 0;
      
      for (let i = 0; i < pages.length; i++) {
        totalLength += pages[i].length;
        if (totalLength >= contentLength * 0.8) { // Go to page with 80% of content
          targetPage = i;
          break;
        }
      }
      
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }
    }
  }, [content, isStreaming, pages, currentPage]);

  // Typewriter effect
  useEffect(() => {
    if (!isStreaming || !content) return;

    const targetContent = pages[currentPage] || content;
    
    if (currentIndex < targetContent.length) {
      intervalRef.current = setTimeout(() => {
        setDisplayedContent(targetContent.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 1000 / speed);
    }

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [content, currentIndex, isStreaming, speed, pages, currentPage]);

  // Reset animation when page changes
  useEffect(() => {
    setCurrentIndex(0);
    setDisplayedContent('');
    
    // Smooth scroll to show the page change during generation
    if (isStreaming) {
      const pageIndicator = document.querySelector('.page-indicator');
      if (pageIndicator) {
        pageIndicator.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentPage, isStreaming]);

  // When streaming stops, show full content immediately
  useEffect(() => {
    if (!isStreaming && content) {
      setDisplayedContent(pages[currentPage] || content);
      setCurrentIndex((pages[currentPage] || content).length);
    }
  }, [isStreaming, content, pages, currentPage]);

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const isPaginated = pages.length > 1;

  return (
    <div className="w-full">
      {/* Page Header */}
      {isPaginated && (
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg border page-indicator">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Document Preview</span>
            {isStreaming && (
              <span className="text-xs text-accent font-medium animate-pulse">● Live Generation</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              Page {currentPage + 1} of {pages.length}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={currentPage === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentPage === pages.length - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Content */}
      <div className="w-full">
        <div
          key={currentPage}
          className="prose prose-slate dark:prose-invert max-w-none
                     prose-headings:text-foreground prose-p:text-foreground 
                     prose-strong:text-foreground prose-li:text-foreground
                     prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary
                     prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded
                     prose-pre:bg-muted prose-pre:border
                     prose-table:text-sm prose-th:bg-muted
                     prose-hr:border-border
                     bg-card p-6 rounded-lg border shadow-sm
                     min-h-[600px] page-content"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom styling for various markdown elements
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mb-6 pb-2 border-b border-border">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold mt-8 mb-4 text-primary">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-medium mt-6 mb-3">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-foreground">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="mb-4 ml-6 list-disc space-y-2">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-4 ml-6 list-decimal space-y-2">
                  {children}
                </ol>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary bg-muted/50 pl-4 py-2 my-4 italic">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-6">
                  <table className="w-full border-collapse border border-border rounded-lg">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-border px-4 py-2">
                  {children}
                </td>
              )
            }}
          >
            {displayedContent}
          </ReactMarkdown>
          
          {/* Typewriter cursor */}
          {isStreaming && (
            <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
            className="inline-block w-2 h-4 bg-primary ml-1"
          />
        )}
        </div>
      </div>
    </div>
  );
};