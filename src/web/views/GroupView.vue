<script setup lang="ts">
import { computed, type Component } from 'vue'

import EmptyState from '@web/components/EmptyState.vue'
import { useProjectStore } from '@web/stores/project.store'

import { artifactListConfigs } from './crm/artifact-list.configs'
import ArtifactListView from './crm/ArtifactListView.vue'
import FunctionsView from './crm/FunctionsView.vue'
import ModulesView from './crm/ModulesView.vue'
import WorkflowsView from './crm/WorkflowsView.vue'
import IssuesView from './projects/IssuesView.vue'
import TasksView from './projects/TasksView.vue'

const props = defineProps<{ area: string; group: string }>()
const projectStore = useProjectStore()
const artifactGroup = computed(() => projectStore.findGroup(props.area, props.group))

const dedicatedViews: Record<string, Record<string, Component>> = {
    crm: { functions: FunctionsView, modules: ModulesView, workflows: WorkflowsView },
    // Milestones and task lists are levels of the same tree the tasks hang from.
    projects: { milestones: TasksView, 'task-lists': TasksView, tasks: TasksView, issues: IssuesView },
}
const dedicatedView = computed(() => dedicatedViews[props.area]?.[props.group])
const listConfig = computed(() => (props.area === 'crm' ? artifactListConfigs[props.group] : undefined))
</script>

<template>
    <component :is="dedicatedView" v-if="dedicatedView" />
    <ArtifactListView v-else-if="listConfig" :key="group" :config="listConfig" />
    <EmptyState v-else :title="artifactGroup?.label ?? 'Unknown group'" :message="artifactGroup?.relativePath" />
</template>
