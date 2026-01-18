import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
  },
});
