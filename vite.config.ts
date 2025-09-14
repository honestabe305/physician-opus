import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  build: {
    // Optimize for modern browsers
    target: 'es2020',
    
    // Set chunk size warning limit to 1MB
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React and React DOM - Core framework
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          
          // UI Component Libraries - Radix UI and shadcn components
          if (id.includes('@radix-ui/') || 
              id.includes('cmdk') ||
              id.includes('embla-carousel') ||
              id.includes('vaul')) {
            return 'ui-components';
          }
          
          // Chart and visualization libraries
          if (id.includes('recharts') ||
              id.includes('d3-') ||
              id.includes('victory')) {
            return 'charts';
          }
          
          // Data handling and utilities
          if (id.includes('date-fns') ||
              id.includes('zod') ||
              id.includes('drizzle-') ||
              id.includes('@tanstack/react-query') ||
              id.includes('react-hook-form') ||
              id.includes('@hookform/resolvers')) {
            return 'utils';
          }
          
          // File upload and storage utilities
          if (id.includes('@uppy/') ||
              id.includes('@google-cloud/storage')) {
            return 'file-handling';
          }
          
          // Other vendor libraries
          if (id.includes('node_modules/')) {
            // Group remaining vendor code
            return 'vendor';
          }
        },
      },
    },
  },
}));
