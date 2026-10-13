import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'

export type Theme = 'dark' | 'light'

const storageKey = 'zoho-studio:theme'

function readStoredTheme(): Theme {
    return localStorage.getItem(storageKey) === 'dark' ? 'dark' : 'light'
}

export const useThemeStore = defineStore('theme', () => {
    const theme = ref<Theme>(readStoredTheme())

    watchEffect(() => {
        document.documentElement.dataset.theme = theme.value
        localStorage.setItem(storageKey, theme.value)
    })

    function toggle() {
        theme.value = theme.value === 'dark' ? 'light' : 'dark'
    }

    return { theme, toggle }
})
