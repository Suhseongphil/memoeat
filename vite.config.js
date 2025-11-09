import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // 큰 라이브러리들을 별도 청크로 분리
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'tiptap-vendor': [
            '@tiptap/react',
            '@tiptap/core',
            '@tiptap/starter-kit',
            '@tiptap/extension-bold',
            '@tiptap/extension-italic',
            '@tiptap/extension-heading',
            '@tiptap/extension-history',
            '@tiptap/extension-text-align',
            '@tiptap/extension-color',
            '@tiptap/extension-font-family',
            '@tiptap/extension-text-style',
            '@tiptap/extension-link',
            '@tiptap/extension-underline',
          ],
          'supabase-vendor': ['@supabase/supabase-js'],
          'utils-vendor': ['lodash', 'axios'],
        },
        // 청크 파일명 형식
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 청크 크기 경고 제한 (500KB)
    chunkSizeWarningLimit: 500,
  },
  server: {
    hmr: {
      overlay: true,
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
  },
})
