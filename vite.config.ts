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
    build: {
        outDir: '../../dist/web',
        emptyOutDir: true,
    },
})
