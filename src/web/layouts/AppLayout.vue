<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'

import AppSidebar from '@web/components/AppSidebar.vue'
import AppTopbar from '@web/components/AppTopbar.vue'
import LoginDialog from '@web/components/LoginDialog.vue'
import PullDialog from '@web/components/PullDialog.vue'
import PullPanel from '@web/components/PullPanel.vue'
import { useProjectStore } from '@web/stores/project.store'

const projectStore = useProjectStore()
let stopListening = () => {}

onMounted(() => {
    void projectStore.load()
    stopListening = projectStore.listen()
})

onUnmounted(() => stopListening())
</script>

<template>
    <div class="grid h-full grid-cols-[260px_1fr]">
        <AppSidebar />
        <main class="flex min-h-0 min-w-0 flex-col">
            <AppTopbar />
            <p v-if="projectStore.loadError" class="border-b border-err/40 bg-err/10 px-5 py-2 text-[13px] text-err">
                Cannot reach the Zoho Studio server: {{ projectStore.loadError }}
            </p>
            <div class="min-h-0 flex-1 overflow-auto">
                <RouterView />
            </div>
        </main>
    </div>
    <PullDialog />
    <PullPanel />
    <LoginDialog />
</template>
