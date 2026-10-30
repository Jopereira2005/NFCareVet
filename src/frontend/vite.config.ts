import { fileURLToPath, URL } from 'node:url';

import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// @nfcarevet/common is a workspace package compiled to CommonJS (it is shared with the NestJS backend).
// Linked packages are not pre-bundled by default, so it is listed explicitly to be converted to ESM.
const SHARED_PACKAGE = '@nfcarevet/common';

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Lets every module write `@use 'abstracts' as *;` instead of long relative paths
        loadPaths: [fileURLToPath(new URL('./src/styles', import.meta.url))],
      },
    },
  },
  optimizeDeps: {
    include: [SHARED_PACKAGE],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /common[\\/]dist/],
    },
  },
});
