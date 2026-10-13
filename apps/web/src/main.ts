import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { router } from './router'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'

import './styles/main.css'

createApp(App).use(createPinia()).use(router).mount('#app')
