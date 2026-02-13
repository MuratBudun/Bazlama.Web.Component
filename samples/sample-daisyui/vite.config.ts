import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import htmImportPlugin from './src/vite-plugin/htm-import'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  base: process.env.BASE_PATH || '/',
  
  resolve: {
    alias: {
      'bazlama-web-component': resolve(__dirname, '../../libs/core/src/index.ts')
    }
  },
  
  define: {
    __DEV__: JSON.stringify(mode !== 'production')
  },
  
  plugins: [
    tailwindcss(),
    htmImportPlugin(),
  ],
}))