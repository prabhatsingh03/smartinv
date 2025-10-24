import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_BASE_URL || 'http://127.0.0.1:5170';

  return {
    plugins: [react(), tsconfigPaths()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@routes': path.resolve(__dirname, 'src/routes'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@config': path.resolve(__dirname, 'src/config'),
        '@theme': path.resolve(__dirname, 'src/theme'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@types': path.resolve(__dirname, 'src/types/index.ts')
      }
    },
    server: {
      host: true,
      port: 3330,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        },
        '/auth': {
          target: apiTarget,
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
