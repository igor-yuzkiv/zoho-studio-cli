import type { ArtifactGroupSummary, PullOptionName } from '@cli/commands/browser/browser.types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type PullDialogTarget = {
    group: ArtifactGroupSummary
    presetOptions: Partial<Record<PullOptionName, string>>
}

export const useUiStore = defineStore('ui', () => {
    const pullDialogTarget = ref<PullDialogTarget | null>(null)
    const pullPanelOpen = ref(false)
    const loginDialogOpen = ref(false)

    function openPullDialog(group: ArtifactGroupSummary, presetOptions: PullDialogTarget['presetOptions'] = {}) {
        pullDialogTarget.value = { group, presetOptions }
    }

    function closePullDialog() {
        pullDialogTarget.value = null
    }

    return { pullDialogTarget, pullPanelOpen, loginDialogOpen, openPullDialog, closePullDialog }
})
