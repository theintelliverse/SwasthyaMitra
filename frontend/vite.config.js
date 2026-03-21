import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    }
  },
  build: {
    // SEO optimizations for production build
    minify: 'terser',
    cssCodeSplit: true,
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
    // Asset optimization
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'sweetalert2'],
        },
        // Files under 4kb will be inlined as base64
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|gif|svg|webp|ico/.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          } else if (ext === 'css') {
            return `assets/css/[name]-[hash][extname]`;
          } else if (ext === 'js') {
            return `assets/js/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
