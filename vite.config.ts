import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
    root: 'src/web',
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: {
            '@web': fileURLToPath(new URL('./src/web', import.meta.url)),
        },
    },
    // Relative asset URLs let the CLI serve the build from any origin and port.
    base: './',
    server: {
        // `zoho-studio browser --port 4321 --no-open` serves the API while Vite serves the page.
        proxy: { '/api': 'http://127.0.0.1:4321' },
    },
    build: {
        outDir: '../../dist/web',
        emptyOutDir: true,
    },
})
