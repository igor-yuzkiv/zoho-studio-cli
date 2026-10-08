<script setup lang="ts">
import AppButton from './AppButton.vue'
import JsonViewer from './JsonViewer.vue'

defineProps<{ value: unknown; title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
    <Transition name="fade">
        <div
            v-if="value"
            class="fixed inset-0 z-50 grid place-items-center bg-black/55 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            :aria-label="title"
            @click.self="emit('close')"
            @keydown.esc="emit('close')"
        >
            <div
                class="flex max-h-[85vh] w-[760px] max-w-[94vw] flex-col rounded-xl border border-line bg-bg shadow-2xl"
            >
                <header class="flex items-center gap-3 border-b border-line px-5 py-3">
                    <h2 class="truncate font-semibold">{{ title }}</h2>
                    <AppButton class="ml-auto" size="sm" @click="emit('close')">Close</AppButton>
                </header>
                <div class="min-h-0 overflow-auto">
                    <JsonViewer :value="value" />
                </div>
            </div>
        </div>
    </Transition>
</template>
