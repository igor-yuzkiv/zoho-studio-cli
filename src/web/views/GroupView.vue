<script setup lang="ts">
import { computed } from 'vue'

import EmptyState from '@web/components/EmptyState.vue'
import { useProjectStore } from '@web/stores/project.store'

import { artifactListConfigs } from './crm/artifact-list.configs'
import ArtifactListView from './crm/ArtifactListView.vue'
import FunctionsView from './crm/FunctionsView.vue'
import ModulesView from './crm/ModulesView.vue'
import WorkflowsView from './crm/WorkflowsView.vue'

const props = defineProps<{ area: string; group: string }>()
const projectStore = useProjectStore()
const artifactGroup = computed(() => projectStore.findGroup(props.area, props.group))

const dedicatedViews = { functions: FunctionsView, modules: ModulesView, workflows: WorkflowsView }
const dedicatedView = computed(() =>
    props.area === 'crm' ? dedicatedViews[props.group as keyof typeof dedicatedViews] : undefined
)
const listConfig = computed(() => (props.area === 'crm' ? artifactListConfigs[props.group] : undefined))
</script>

<template>
    <component :is="dedicatedView" v-if="dedicatedView" />
    <ArtifactListView v-else-if="listConfig" :key="group" :config="listConfig" />
    <EmptyState v-else :title="artifactGroup?.label ?? 'Unknown group'" :message="artifactGroup?.relativePath" />
</template>
