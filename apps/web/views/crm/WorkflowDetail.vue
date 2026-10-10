<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AppBadge from '@web/components/AppBadge.vue'

import type { WorkflowAction, WorkflowCriterion, WorkflowRule } from './crm.types'

defineProps<{ workflow: WorkflowRule }>()

const comparatorLabels: Record<string, string> = {
    equal: 'is',
    not_equal: 'is not',
    greater_equal: '≥',
    greater_than: '>',
    less_equal: '≤',
    less_than: '<',
    contains: 'contains',
    not_contains: "doesn't contain",
    starts_with: 'starts with',
    ends_with: 'ends with',
    'is empty': 'is empty',
    'is not empty': 'is not empty',
}

function describeTrigger(workflow: WorkflowRule): string {
    const type = workflow.execute_when?.type ?? 'unknown'

    return type.replace(/_/g, ' ')
}

function describeCriterion(criterion: WorkflowCriterion | null | undefined): string {
    if (!criterion) {
        return 'All records'
    }

    if (criterion.group?.length) {
        return criterion.group.map(describeCriterion).join(` ${criterion.group_operator ?? 'AND'} `)
    }

    const comparator = comparatorLabels[criterion.comparator ?? ''] ?? criterion.comparator ?? ''
    const value = typeof criterion.value === 'object' ? JSON.stringify(criterion.value) : String(criterion.value ?? '')

    return `${criterion.field?.api_name ?? '?'} ${comparator} ${value}`.trim()
}

function actionLink(action: WorkflowAction) {
    return {
        name: 'group',
        params: { area: 'crm', group: 'workflow-actions' },
        query: { type: action.type.replace(/_/g, '-'), name: action.name },
    }
}
</script>

<template>
    <div class="flex flex-col px-6 py-5">
        <div class="grid grid-cols-[28px_1fr] gap-3">
            <div class="flex flex-col items-center">
                <div class="grid size-[22px] place-items-center rounded-full border border-line bg-surface text-[11px]">
                    ⚡
                </div>
                <div class="min-h-3.5 w-px flex-1 bg-line" />
            </div>
            <div class="mb-3 rounded-[9px] border border-line bg-surface px-3.5 py-3">
                <div class="text-[11px] tracking-wider text-faint uppercase">Trigger</div>
                <span class="capitalize">{{ describeTrigger(workflow) }}</span>
                <span v-if="workflow.module?.api_name" class="text-muted"> · {{ workflow.module.api_name }}</span>
            </div>
        </div>

        <template v-for="(condition, index) in workflow.conditions ?? []" :key="condition.id">
            <div class="grid grid-cols-[28px_1fr] gap-3">
                <div class="flex flex-col items-center">
                    <div
                        class="grid size-[22px] place-items-center rounded-full border border-line bg-surface text-[11px] text-muted"
                    >
                        ?
                    </div>
                    <div class="min-h-3.5 w-px flex-1 bg-line" />
                </div>
                <div class="mb-3 rounded-[9px] border border-line bg-surface px-3.5 py-3">
                    <div class="text-[11px] tracking-wider text-faint uppercase">Condition {{ index + 1 }}</div>
                    <span class="font-mono text-[13px]">{{
                        describeCriterion(condition.criteria_details?.criteria)
                    }}</span>
                </div>
            </div>
            <div class="grid grid-cols-[28px_1fr] gap-3">
                <div class="flex flex-col items-center">
                    <div
                        class="grid size-[22px] place-items-center rounded-full border border-line bg-surface text-[11px] text-muted"
                    >
                        ▶
                    </div>
                    <div
                        class="min-h-3.5 w-px flex-1 bg-line"
                        :class="index === (workflow.conditions?.length ?? 0) - 1 && 'invisible'"
                    />
                </div>
                <div class="mb-3 rounded-[9px] border border-line bg-surface px-3.5 py-3">
                    <div class="text-[11px] tracking-wider text-faint uppercase">
                        Instant actions · {{ condition.instant_actions?.actions?.length ?? 0 }}
                    </div>
                    <RouterLink
                        v-for="action in condition.instant_actions?.actions ?? []"
                        :key="action.id"
                        :to="actionLink(action)"
                        class="flex items-center gap-2.5 border-t border-dashed border-line py-2 first-of-type:border-0 hover:text-accent"
                    >
                        <AppBadge>{{ action.type.replace(/_/g, ' ') }}</AppBadge>
                        {{ action.name }}
                    </RouterLink>
                    <template
                        v-for="(scheduled, scheduledIndex) in condition.scheduled_actions ?? []"
                        :key="scheduledIndex"
                    >
                        <div class="mt-2 text-[11px] tracking-wider text-faint uppercase">Scheduled</div>
                        <RouterLink
                            v-for="action in scheduled.actions ?? []"
                            :key="action.id"
                            :to="actionLink(action)"
                            class="flex items-center gap-2.5 py-1.5 hover:text-accent"
                        >
                            <AppBadge>{{ action.type.replace(/_/g, ' ') }}</AppBadge>
                            {{ action.name }}
                        </RouterLink>
                    </template>
                </div>
            </div>
        </template>
    </div>
</template>
