import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// This configuration is only relevant when running dev locally using Vite.
// Production build is handled by NGINX, which has its own settings.
export default () => {
  const frontendPort: number = 3000;
  const target = `http://localhost:5000`;

  return defineConfig({
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    server: {
      host: true,
      port: frontendPort,
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  });
};
