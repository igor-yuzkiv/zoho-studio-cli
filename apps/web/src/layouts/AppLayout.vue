<script setup lang="ts">
import { onMounted, onUnmounted, watchEffect } from 'vue'
import { RouterView } from 'vue-router'

import AppSidebar from '@web/components/AppSidebar.vue'
import AppStatusBar from '@web/components/AppStatusBar.vue'
import AppTopbar from '@web/components/AppTopbar.vue'
import LoginDialog from '@web/components/LoginDialog.vue'
import PullDialog from '@web/components/PullDialog.vue'
import PullPanel from '@web/components/PullPanel.vue'
import { useProjectStore } from '@web/stores/project.store'

const projectStore = useProjectStore()
let stopListening = () => {}

// Several projects can be open in tabs side by side, so the tab names the project.
watchEffect(() => {
    document.title = projectStore.project ? `${projectStore.project.name} · Zoho Studio` : 'Zoho Studio'
})

onMounted(() => {
    void projectStore.load()
    stopListening = projectStore.listen()
})

onUnmounted(() => stopListening())
</script>

<template>
    <div class="flex h-full flex-col">
        <div class="grid min-h-0 flex-1 grid-cols-[auto_1fr]">
            <AppSidebar />
            <main class="flex min-h-0 min-w-0 flex-col">
                <AppTopbar />
                <p
                    v-if="projectStore.loadError"
                    class="border-b border-err/40 bg-err/10 px-5 py-2 text-[13px] text-err"
                >
                    Cannot reach the Zoho Studio server: {{ projectStore.loadError }}
                </p>
                <div class="min-h-0 flex-1 overflow-auto">
                    <RouterView />
                </div>
            </main>
        </div>
        <AppStatusBar />
    </div>
    <PullDialog />
    <PullPanel />
    <LoginDialog />
</template>
