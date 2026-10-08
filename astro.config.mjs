// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
// Hosting: Cloudflare Pages estático (TECHNICAL_BIBLE §1). Vercel sin uso.
export default defineConfig({
  base: '/Gold-mining/',
  output: 'static',
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
