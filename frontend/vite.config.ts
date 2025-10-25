import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          
          // UI components chunk
          ui: [
            'lucide-react',
            'framer-motion',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-slot',
            '@radix-ui/react-toast',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toggle',
            '@radix-ui/react-tooltip'
          ],
          
          // Document processing chunk
          documents: [
            'jspdf',
            'html2canvas',
            'file-saver',
            'react-markdown',
            'remark-gfm'
          ],
          
          // Utilities chunk
          utils: [
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
            'cmdk'
          ]
        }
      }
    },
    // Increase chunk size warning limit to 1MB for better chunking
    chunkSizeWarningLimit: 1000,
    // Enable source maps for better debugging
    sourcemap: false, // Disable in production for smaller builds
    // Enable minification with esbuild (faster than terser)
    minify: 'esbuild' as const
  }
}));
