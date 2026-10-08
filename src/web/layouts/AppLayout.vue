<script setup lang="ts">
import { RouterView } from 'vue-router'

import AppSidebar from '@web/components/AppSidebar.vue'
import AppTopbar from '@web/components/AppTopbar.vue'
</script>

<template>
    <div class="grid h-full grid-cols-[260px_1fr]">
        <AppSidebar />
        <main class="flex min-h-0 min-w-0 flex-col">
            <AppTopbar />
            <div class="min-h-0 flex-1 overflow-auto">
                <RouterView />
            </div>
        </main>
    </div>
</template>
