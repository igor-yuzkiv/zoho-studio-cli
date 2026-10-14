<script setup lang="ts">
import { computed } from 'vue'

import AppBadge from '@web/components/AppBadge.vue'

import type { LayoutSection } from './crm.types'

const props = defineProps<{ section: LayoutSection; showMode?: boolean }>()

const columnCount = computed(() => props.section.column_count ?? 1)
const fields = computed(() =>
    [...(props.section.fields ?? [])].sort((left, right) => (left.sequence_number ?? 0) - (right.sequence_number ?? 0))
)
</script>

<template>
    <section class="mt-3 overflow-hidden rounded-[10px] border border-line bg-surface">
        <header class="flex items-center gap-2.5 bg-surface-2 px-3.5 py-2">
            <span class="font-medium">{{ section.display_label ?? section.api_name }}</span>
            <span class="font-mono text-xs text-faint">{{ section.api_name }}</span>
            <AppBadge v-if="showMode && section.mode">{{ section.mode.replace(/_/g, ' ') }}</AppBadge>
            <span class="ml-auto text-xs text-faint">
                {{ columnCount }} {{ columnCount === 1 ? 'column' : 'columns' }} · {{ fields.length }} fields
            </span>
        </header>
        <div class="grid" :style="{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }">
            <div
                v-for="field in fields"
                :key="field.api_name"
                class="flex min-w-0 flex-wrap items-baseline gap-2 border-t border-line px-3.5 py-1.5"
            >
                {{ field.field_label }}
                <span class="font-mono text-xs text-faint">{{ field.api_name }}</span>
                <AppBadge v-if="field.data_type === 'formula'" tone="accent">
                    formula → {{ field.formula?.return_type }}
                </AppBadge>
                <AppBadge v-else>{{ field.data_type }}</AppBadge>
                <span v-if="field.system_mandatory" class="text-xs text-faint">required</span>
                <code
                    v-if="field.formula?.expression"
                    class="w-full truncate rounded-md border border-dashed border-line bg-surface-2 px-2 py-0.5 font-mono text-xs"
                    :title="field.formula.expression"
                    >{{ field.formula.expression }}</code
                >
            </div>
        </div>
    </section>
</template>
