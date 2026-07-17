import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Charger les variables d'environnement
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'

  return {
    plugins: [
      vue(),
      VueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(env.VITE_DEV_PORT) || 5173,
      strictPort: false, // Permettre à Vite de choisir un autre port si occupé
      open: isDev, // Ouvrir automatiquement le navigateur en développement
      watch: {
        usePolling: true
      },
      // Proxy pour les fichiers media vers le backend Django
      proxy: {
        '^/media/': {
          target: env.VITE_API_BASE_URL?.replace('/api/v1/', '') || 'http://127.0.0.1:8000',
          changeOrigin: true
        }
      }
    },
    // Configuration de build pour la production
    build: {
      outDir: 'dist',
      sourcemap: isDev,
      minify: isDev ? false : 'esbuild',
    },
    // Supprimer tous les console.* et debugger en production
    esbuild: isDev ? {} : {
      drop: ['console', 'debugger'],
    }
  }
})
