import { createRouter, createWebHashHistory } from 'vue-router'

import GroupView from '@web/views/GroupView.vue'
import OverviewView from '@web/views/OverviewView.vue'

// Hash history keeps every route a request for index.html, so the server needs no SPA fallback.
export const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', name: 'overview', component: OverviewView },
        { path: '/:area/:group', name: 'group', component: GroupView, props: true },
    ],
})
