import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import htmImportPlugin from './src/vite-plugin/htm-import'

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    tailwindcss(),
    htmImportPlugin(),
  ],
})