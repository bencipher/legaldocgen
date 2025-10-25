import { motion } from 'framer-motion';
import { FileText, Loader2 } from 'lucide-react';
import { lazy, Suspense } from 'react';

// Lazy load heavy components containing large dependencies
const ExportButtons = lazy(() => import('./ExportButtons').then(module => ({ default: module.ExportButtons })));
const TypewriterMarkdown = lazy(() => import('./TypewriterMarkdown').then(module => ({ default: module.TypewriterMarkdown })));

interface PreviewPaneProps {
  content: string;
  isGenerating: boolean;
  isGenerationStarting?: boolean;
  onBackToChat: () => void;
}

export const PreviewPane = ({ content, isGenerating, isGenerationStarting = false, onBackToChat }: PreviewPaneProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Document Preview</h2>
          {isGenerating && (
            <div className="flex items-center gap-2 text-accent">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Generating...</span>
            </div>
          )}
        </div>
        <Suspense fallback={
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading export options...</span>
          </div>
        }>
          <ExportButtons content={content} isGenerating={isGenerating} onBackToChat={onBackToChat} />
        </Suspense>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {isGenerationStarting ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mb-6 shadow-glow animate-pulse">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
            <h3 className="text-2xl font-semibold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Generation Starting...
            </h3>
            <p className="text-muted-foreground max-w-md">
              Your legal document is about to be generated. Please wait while we prepare the content...
            </p>
            <div className="flex gap-2 mt-6">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </motion.div>
        ) : content ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            id="preview-content"
            className="max-w-4xl mx-auto"
          >
            <Suspense fallback={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Loading document renderer...</span>
              </div>
            }>
              <TypewriterMarkdown 
                content={content} 
                isStreaming={isGenerating}
                speed={100}
              />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-accent flex items-center justify-center mb-6 shadow-glow animate-pulse-glow">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Document Preview</h3>
            <p className="text-muted-foreground max-w-md">
              Your generated document will appear here. The preview updates in real-time as the AI creates your content.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
