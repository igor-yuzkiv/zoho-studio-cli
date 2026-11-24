import { createRouter, createWebHashHistory } from 'vue-router'

import GroupView from '@web/views/GroupView.vue'
import OverviewView from '@web/views/OverviewView.vue'
import WidgetsView from '@web/views/WidgetsView.vue'

// Hash history keeps every route a request for index.html, so the server needs no SPA fallback.
export const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        { path: '/', name: 'overview', component: OverviewView },
        { path: '/widgets', name: 'widgets', component: WidgetsView },
        { path: '/:area/:group', name: 'group', component: GroupView, props: true },
    ],
})
