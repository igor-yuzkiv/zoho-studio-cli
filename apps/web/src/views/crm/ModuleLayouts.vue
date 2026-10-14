<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import JsonDialog from '@web/components/JsonDialog.vue'

import type { LayoutMetadata } from './crm.types'
import LayoutSectionCard from './LayoutSectionCard.vue'

const props = defineProps<{ layouts: LayoutMetadata[] }>()

/** The sections of the record page; quick create and business card sections live in modes of their own. */
const recordPageModes = new Set([undefined, 'default_create'])

const selectedLayoutId = ref<string | null>(null)
const rawLayout = ref<LayoutMetadata | null>(null)

watch(
    () => props.layouts,
    (layouts) => {
        if (!layouts.some(({ id }) => id === selectedLayoutId.value)) {
            selectedLayoutId.value = layouts[0]?.id ?? null
        }
    },
    { immediate: true }
)

const layout = computed(() => props.layouts.find(({ id }) => id === selectedLayoutId.value) ?? null)
const sections = computed(() =>
    [...(layout.value?.sections ?? [])].sort(
        (left, right) => (left.sequence_number ?? 0) - (right.sequence_number ?? 0)
    )
)
const recordPageSections = computed(() => sections.value.filter(({ mode }) => recordPageModes.has(mode)))
const otherModeSections = computed(() => sections.value.filter(({ mode }) => !recordPageModes.has(mode)))
</script>

<template>
    <div class="mt-4">
        <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-faint">Layout:</span>
            <button
                v-for="item in layouts"
                :key="item.id"
                type="button"
                class="rounded-full border px-2.5 py-0.5"
                :class="item.id === selectedLayoutId ? 'border-accent text-accent' : 'border-line hover:bg-hover'"
                @click="selectedLayoutId = item.id"
            >
                {{ item.display_label ?? item.name ?? item.api_name }}
                <span class="font-mono text-xs text-faint">{{ item.api_name }}</span>
            </button>
            <span v-if="layout" class="ml-auto text-xs text-faint">
                {{ layout.status }}
                <template v-if="layout.profiles?.length">
                    · profiles: {{ layout.profiles.map(({ name }) => name).join(', ') }}
                </template>
            </span>
            <button
                v-if="layout"
                type="button"
                class="rounded-md border border-line px-2 py-0.5 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent"
                :aria-label="`Raw JSON of ${layout.api_name}`"
                @click="rawLayout = layout"
            >
                { }
            </button>
        </div>

        <LayoutSectionCard v-for="section in recordPageSections" :key="section.id" :section="section" />

        <details v-if="otherModeSections.length" class="mt-4">
            <summary class="cursor-pointer text-muted">Other modes · {{ otherModeSections.length }} sections</summary>
            <LayoutSectionCard v-for="section in otherModeSections" :key="section.id" :section="section" show-mode />
        </details>
    </div>
    <JsonDialog
        :value="rawLayout"
        :title="rawLayout ? `${rawLayout.display_label ?? rawLayout.api_name} · ${rawLayout.api_name}` : ''"
        @close="rawLayout = null"
    />
</template>
