import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                app: resolve(__dirname, 'app.html'),
                keywordRank: resolve(__dirname, 'keyword-rank.html'),
                promptTracker: resolve(__dirname, 'prompt-tracker.html'),
                aeoOptimizer: resolve(__dirname, 'aeo-optimizer.html'),
            },
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
