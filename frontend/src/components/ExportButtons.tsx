import React from 'react';
import { Download, FileText, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from '@/hooks/use-toast';

interface ExportButtonsProps {
  content: string;
  isGenerating: boolean;
  onBackToChat: () => void;
}

export const ExportButtons = ({ content, isGenerating, onBackToChat }: ExportButtonsProps) => {
  const handleExportMarkdown = () => {
    if (!content) return;

    try {
      // Remove PAGE_BREAK markers for clean markdown export
      let cleanContent = content.replace(/---PAGE_BREAK---/g, '\n\n');
      
      // Remove any remaining standalone dashes that might be page break artifacts
      cleanContent = cleanContent.replace(/^---\s*$/gm, '');
      cleanContent = cleanContent.replace(/^\s*---\s*$/gm, '');
      
      // Remove multiple consecutive newlines
      cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');
      
      const blob = new Blob([cleanContent], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, `document_${Date.now()}.md`);
      toast({
        title: 'Markdown Exported',
        description: 'Your document has been downloaded as Markdown.',
      });
    } catch (error) {
      console.error('Export Markdown failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export Markdown. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportHTML = () => {
    if (!content) return;

    try {
      // Convert markdown to HTML using a simple markdown parser
      // Remove PAGE_BREAK markers first
      let cleanContent = content.replace(/---PAGE_BREAK---/g, '\n\n');
      
      // Remove any remaining standalone dashes that might be page break artifacts
      cleanContent = cleanContent.replace(/^---\s*$/gm, '');
      cleanContent = cleanContent.replace(/^\s*---\s*$/gm, '');
      
      // Remove multiple consecutive newlines
      cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');
      
      // Basic markdown to HTML conversion
      const htmlContent = cleanContent
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>') // Convert markdown links
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
        .replace(/\n\n/gim, '</p><p>')
        .replace(/^(?!<[h|l|p])/gim, '<p>')
        .replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
        .replace(/<\/ul>\s*<ul>/gim, '')
        .replace(/(<li>.*<\/li>)/gims, (match) => {
          if (match.includes('1.')) {
            return match.replace('<ul>', '<ol>').replace('</ul>', '</ol>');
          }
          return match;
        });

      // Create full HTML document
      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Legal Document</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #fff;
        }
        h1, h2, h3, h4 {
            color: #2563eb;
            margin-top: 2em;
            margin-bottom: 1em;
        }
        h1 { font-size: 2.5em; border-bottom: 2px solid #2563eb; padding-bottom: 0.3em; }
        h2 { font-size: 2em; }
        h3 { font-size: 1.5em; }
        h4 { font-size: 1.2em; }
        p { margin-bottom: 1em; }
        ul, ol { margin-bottom: 1em; padding-left: 2em; }
        li { margin-bottom: 0.5em; }
        strong { color: #1e40af; }
        a { color: #2563eb; text-decoration: underline; }
        a:hover { color: #1d4ed8; }
        @media print {
            body { margin: 0; padding: 20px; }
            h1 { page-break-before: always; }
        }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      saveAs(blob, `document_${Date.now()}.html`);
      toast({
        title: 'HTML Exported',
        description: 'Your document has been downloaded as formatted HTML.',
      });
    } catch (error) {
      console.error('Export HTML failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export HTML. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = async () => {
    if (!content) return;

    try {
      toast({
        title: 'Generating PDF',
        description: 'Please wait while we prepare your document...',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // PDF dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Margins
      const marginTop = 25;
      const marginBottom = 25;
      const marginLeft = 20;
      const marginRight = 20;
      
      // Content area
      const contentWidth = pageWidth - marginLeft - marginRight;
      const contentHeight = pageHeight - marginTop - marginBottom;
      
      // Text settings
      const currentY = marginTop;
      const lineHeight = 7; // mm
      const fontSize = 11;
      
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', 'normal');

      // Clean and process content
      let cleanContent = content.replace(/---PAGE_BREAK---/g, '\n\n');
      
      // Remove any remaining standalone dashes that might be page break artifacts
      cleanContent = cleanContent.replace(/^---\s*$/gm, '');
      cleanContent = cleanContent.replace(/^\s*---\s*$/gm, '');
      
      // Remove multiple consecutive newlines and replace with double newlines
      cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');
      
      // Process markdown links: convert [text](url) to just text for PDF
      const processedContent = cleanContent.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      
      const lines = processedContent.split('\n');
      
      let currentLine = marginTop;
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        if (!line && i < lines.length - 1) {
          // Empty line - add spacing
          currentLine += lineHeight * 0.5;
          continue;
        }
        
        // Handle different markdown elements
        if (line.startsWith('# ')) {
          // H1
          if (currentLine > marginTop + 20) {
            currentLine += lineHeight;
          }
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          line = line.substring(2);
        } else if (line.startsWith('## ')) {
          // H2
          if (currentLine > marginTop + 10) {
            currentLine += lineHeight * 0.7;
          }
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          line = line.substring(3);
        } else if (line.startsWith('### ')) {
          // H3
          if (currentLine > marginTop + 10) {
            currentLine += lineHeight * 0.5;
          }
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          line = line.substring(4);
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
          // Bullet list
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          line = '• ' + line.substring(2);
        } else if (/^\d+\.\s/.test(line)) {
          // Numbered list
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
        } else {
          // Normal paragraph
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
        }
        
        // Handle bold and italic (simple approach)
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/);
        let xPosition = marginLeft;
        
        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            // Bold text
            pdf.setFont('helvetica', 'bold');
            const text = part.slice(2, -2);
            
            // Check if we need a new page
            if (currentLine + lineHeight > pageHeight - marginBottom) {
              pdf.addPage();
              currentLine = marginTop;
            }
            
            const textWidth = pdf.getTextWidth(text);
            if (xPosition + textWidth > pageWidth - marginRight) {
              currentLine += lineHeight;
              xPosition = marginLeft;
              if (currentLine + lineHeight > pageHeight - marginBottom) {
                pdf.addPage();
                currentLine = marginTop;
              }
            }
            
            pdf.text(text, xPosition, currentLine);
            xPosition += textWidth;
            pdf.setFont('helvetica', 'normal');
            
          } else if (part.startsWith('*') && part.endsWith('*')) {
            // Italic text
            pdf.setFont('helvetica', 'italic');
            const text = part.slice(1, -1);
            
            if (currentLine + lineHeight > pageHeight - marginBottom) {
              pdf.addPage();
              currentLine = marginTop;
            }
            
            const textWidth = pdf.getTextWidth(text);
            if (xPosition + textWidth > pageWidth - marginRight) {
              currentLine += lineHeight;
              xPosition = marginLeft;
              if (currentLine + lineHeight > pageHeight - marginBottom) {
                pdf.addPage();
                currentLine = marginTop;
              }
            }
            
            pdf.text(text, xPosition, currentLine);
            xPosition += textWidth;
            pdf.setFont('helvetica', 'normal');
            
          } else if (part.trim()) {
            // Normal text
            const words = part.split(' ');
            
            for (const word of words) {
              if (!word) continue;
              
              const wordWithSpace = word + ' ';
              const wordWidth = pdf.getTextWidth(wordWithSpace);
              
              // Check if word fits on current line
              if (xPosition + wordWidth > pageWidth - marginRight) {
                currentLine += lineHeight;
                xPosition = marginLeft;
                
                // Check if we need a new page
                if (currentLine + lineHeight > pageHeight - marginBottom) {
                  pdf.addPage();
                  currentLine = marginTop;
                }
              }
              
              pdf.text(word + ' ', xPosition, currentLine);
              xPosition += wordWidth;
            }
          }
        }
        
        // Move to next line
        currentLine += lineHeight;
        
        // Add extra spacing after headers
        if (line.includes('# ') || line.includes('## ') || line.includes('### ')) {
          currentLine += lineHeight * 0.3;
        }
        
        // Check if we need a new page
        if (currentLine + lineHeight > pageHeight - marginBottom) {
          pdf.addPage();
          currentLine = marginTop;
        }
      }

      pdf.save(`document_${Date.now()}.pdf`);

      toast({
        title: 'PDF Exported',
        description: 'Your document has been downloaded as a text-based PDF.',
      });
    } catch (error) {
      console.error('Export PDF failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
      <Button
        variant="outline"
        onClick={onBackToChat}
        className="gap-1 sm:gap-2 text-xs sm:text-sm"
        size="sm"
      >
        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Back to </span>Chat
      </Button>
      
      <Button
        variant="outline"
        onClick={handleExportMarkdown}
        disabled={!content || isGenerating}
        className="gap-1 sm:gap-2 text-xs sm:text-sm"
        size="sm"
      >
        <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Export </span>Markdown
      </Button>
      
      <Button
        variant="outline"
        onClick={handleExportHTML}
        disabled={!content || isGenerating}
        className="gap-1 sm:gap-2 text-xs sm:text-sm"
        size="sm"
      >
        <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Export </span>HTML
      </Button>

      <Button
        onClick={handleExportPDF}
        disabled={!content || isGenerating}
        className="gap-1 sm:gap-2 bg-gradient-primary hover:shadow-glow transition-all duration-300 text-xs sm:text-sm"
        size="sm"
      >
        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Export </span>PDF
      </Button>
    </div>
  );
};
