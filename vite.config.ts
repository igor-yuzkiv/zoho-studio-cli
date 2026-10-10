import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
    root: 'apps/web',
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: {
            '@web': fileURLToPath(new URL('./apps/web', import.meta.url)),
        },
    },
    // Relative asset URLs let the CLI serve the build from any origin and port.
    base: './',
    server: {
        // `zoho-studio browser --port 4321 --no-open` serves the API while Vite serves the page.
        // The server answers only requests addressed to itself, so the proxy rewrites Host and drops Origin.
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:4321',
                changeOrigin: true,
                configure: (proxy) => proxy.on('proxyReq', (proxyRequest) => proxyRequest.removeHeader('origin')),
            },
        },
    },
    build: {
        outDir: '../../dist/web',
        emptyOutDir: true,
    },
})
