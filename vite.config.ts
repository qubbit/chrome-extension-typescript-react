import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy'
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.'
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        content: 'src/content.tsx',
        background: 'src/background.ts'
      },
      output: {
        entryFileNames: '[name].js'
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
});
