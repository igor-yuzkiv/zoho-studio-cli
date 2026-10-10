<script setup lang="ts">
import type { PullOptionName } from '@cli/commands/browser/browser.types'
import { computed, reactive, ref, watch } from 'vue'

import { api, ApiRequestError } from '@web/api/api.client'
import { useProjectStore } from '@web/stores/project.store'
import { useUiStore } from '@web/stores/ui.store'

import AppButton from './AppButton.vue'

const ui = useUiStore()
const projectStore = useProjectStore()

const values = reactive<Partial<Record<PullOptionName, string>>>({})
const moduleNames = ref<string[]>([])
const submitError = ref<string | null>(null)
const submitting = ref(false)

const target = computed(() => ui.pullDialogTarget)
const group = computed(() => target.value?.group)
const hasOption = (name: PullOptionName) => group.value?.options.includes(name) ?? false

const commandPreview = computed(() => {
    if (!group.value) {
        return ''
    }

    const flags = group.value.options.filter((name) => values[name]).map((name) => `--${name}=${values[name]}`)

    return ['zoho-studio', group.value.command, ...flags].join(' ')
})

const warning = computed(() =>
    group.value?.id === 'modules'
        ? 'This replaces the whole modules folder, fields included. Pull fields again afterwards.'
        : null
)

watch(target, async (current) => {
    for (const name of Object.keys(values) as PullOptionName[]) {
        delete values[name]
    }

    Object.assign(values, current?.presetOptions ?? {})
    submitError.value = null

    if (current?.group.options.includes('module')) {
        const tree = await api.getTree('zoho-crm/modules', 1).catch(() => null)
        moduleNames.value = (tree?.children ?? [])
            .filter((entry) => entry.kind === 'directory')
            .map((entry) => entry.name)
    }
})

async function submit() {
    if (!group.value) {
        return
    }

    submitting.value = true
    submitError.value = null

    try {
        await projectStore.startPull(group.value, { ...values })
        ui.closePullDialog()
        ui.pullPanelOpen = true
    } catch (error) {
        submitError.value =
            error instanceof ApiRequestError && error.status === 409
                ? `Another pull is running: ${error.message}`
                : String(error instanceof Error ? error.message : error)
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <Transition name="fade">
        <div
            v-if="group"
            class="fixed inset-0 z-50 grid place-items-center bg-black/55 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pull-dialog-title"
            @click.self="ui.closePullDialog()"
            @keydown.esc="ui.closePullDialog()"
        >
            <form
                class="w-[460px] max-w-[92vw] rounded-xl border border-line bg-surface shadow-2xl"
                @submit.prevent="submit"
            >
                <header class="px-5 pt-[18px] pb-1">
                    <h2 id="pull-dialog-title" class="text-[17px] font-semibold">
                        Pull {{ group.label.toLowerCase() }}
                    </h2>
                    <p class="text-[13px] text-muted">Replaces the local files with what Zoho returns.</p>
                </header>

                <div class="flex flex-col gap-3.5 px-5 py-3.5">
                    <div v-if="hasOption('module')">
                        <label for="pull-module" class="mb-1.5 block text-[13px] font-medium">Module</label>
                        <select id="pull-module" v-model="values.module" class="field-input">
                            <option :value="undefined">All modules</option>
                            <option v-for="name in moduleNames" :key="name" :value="name">{{ name }}</option>
                        </select>
                        <p class="mt-1 text-xs text-faint">Leave empty to pull every module.</p>
                    </div>

                    <div v-if="hasOption('type')">
                        <label for="pull-type" class="mb-1.5 block text-[13px] font-medium">Action type</label>
                        <select id="pull-type" v-model="values.type" class="field-input">
                            <option :value="undefined">All types</option>
                            <option
                                v-for="type in projectStore.project?.workflowActionTypes ?? []"
                                :key="type"
                                :value="type"
                            >
                                {{ type }}
                            </option>
                        </select>
                    </div>

                    <div v-if="hasOption('from')">
                        <div class="grid grid-cols-2 gap-2.5">
                            <div>
                                <label for="pull-from" class="mb-1.5 block text-[13px] font-medium">Updated from</label>
                                <input id="pull-from" v-model="values.from" type="date" class="field-input" />
                            </div>
                            <div>
                                <label for="pull-to" class="mb-1.5 block text-[13px] font-medium">to</label>
                                <input id="pull-to" v-model="values.to" type="date" class="field-input" />
                            </div>
                        </div>
                        <p class="mt-1 text-xs text-faint">UTC dates. Without a range the whole project is pulled.</p>
                    </div>

                    <p v-if="group.options.length === 0" class="text-xs text-faint">
                        This group has no options — it is always pulled in full.
                    </p>

                    <p v-if="warning" class="rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
                        {{ warning }}
                    </p>

                    <code class="rounded-md border border-line bg-bg px-2.5 py-2 font-mono text-xs text-muted">
                        $ {{ commandPreview }}
                    </code>

                    <p v-if="submitError" class="text-xs text-err">{{ submitError }}</p>
                </div>

                <footer class="flex justify-end gap-2 border-t border-line px-5 py-3.5">
                    <AppButton @click="ui.closePullDialog()">Cancel</AppButton>
                    <AppButton variant="primary" type="submit" :disabled="submitting">↓ Start pull</AppButton>
                </footer>
            </form>
        </div>
    </Transition>
</template>
