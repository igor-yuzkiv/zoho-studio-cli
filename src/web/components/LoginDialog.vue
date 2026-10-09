<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import type { ConnectionName, ProfileSummary } from '@cli/commands/browser/browser.types'
import { api } from '@web/api/api.client'
import { useProjectStore } from '@web/stores/project.store'
import { useUiStore } from '@web/stores/ui.store'
import { formatTimeAgo } from '@web/utils/time.utils'

import AppButton from './AppButton.vue'

const ui = useUiStore()
const projectStore = useProjectStore()
const startError = ref<string | null>(null)
const codeCopied = ref(false)

const newProfileChoice = ''

const profiles = ref<ProfileSummary[]>([])
const connection = ref<ConnectionName>('default')
const selectedProfile = ref(newProfileChoice)
const newProfile = reactive({ name: '', clientId: '', clientSecret: '' })

const state = computed(() => projectStore.loginState)
const inProgress = computed(() => state.value.status === 'starting' || state.value.status === 'waiting')
// A finished login keeps its state on the server, and the other connection may still need one.
const showsForm = computed(() => !inProgress.value)
const creatingProfile = computed(() => selectedProfile.value === newProfileChoice)
const canStart = computed(
    () =>
        !creatingProfile.value ||
        Boolean(newProfile.name.trim() && newProfile.clientId.trim() && newProfile.clientSecret.trim())
)

watch(
    () => ui.loginDialogOpen,
    async (open) => {
        if (!open) {
            return
        }

        try {
            profiles.value = await api.getProfiles()
            selectedProfile.value = profiles.value[0]?.name ?? newProfileChoice
        } catch (error) {
            startError.value = error instanceof Error ? error.message : String(error)
        }
    },
    { immediate: true }
)

async function start() {
    startError.value = null

    try {
        const profile = creatingProfile.value
            ? (await api.createProfile({ ...newProfile })).name
            : selectedProfile.value

        if (creatingProfile.value) {
            profiles.value = await api.getProfiles()
            selectedProfile.value = profile
            Object.assign(newProfile, { name: '', clientId: '', clientSecret: '' })
        }

        await projectStore.startLogin({ profile, connection: connection.value })
    } catch (error) {
        startError.value = error instanceof Error ? error.message : String(error)
    }
}

function describeStatus(name: ConnectionName): string {
    return projectStore.project?.auth[name] === 'authorized' ? 'logged in' : 'not logged in'
}

async function copyCode(code: string) {
    await navigator.clipboard.writeText(code)
    codeCopied.value = true
    setTimeout(() => (codeCopied.value = false), 1500)
}
</script>

<template>
    <Transition name="fade">
        <div
            v-if="ui.loginDialogOpen"
            class="fixed inset-0 z-50 grid place-items-center bg-black/55 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-dialog-title"
            @click.self="ui.loginDialogOpen = false"
            @keydown.esc="ui.loginDialogOpen = false"
        >
            <div class="w-[440px] max-w-[92vw] rounded-xl border border-line bg-surface shadow-2xl">
                <header class="px-5 pt-[18px] pb-1">
                    <h2 id="login-dialog-title" class="text-[17px] font-semibold">Log in to Zoho</h2>
                    <p class="text-[13px] text-muted">
                        The same device flow as <code class="font-mono">zoho-studio login</code>; the tokens are stored
                        in <code class="font-mono">~/.zoho-studio</code>.
                    </p>
                </header>

                <div class="flex flex-col gap-3 px-5 py-4 text-[13px]">
                    <template v-if="state.status === 'waiting'">
                        <p>
                            Open
                            <a
                                :href="state.verificationUrl"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-accent underline"
                            >
                                {{ state.verificationUrl }}
                            </a>
                            and enter this code:
                        </p>
                        <div class="flex items-center gap-3">
                            <code
                                class="flex-1 rounded-md border border-line bg-bg px-3 py-2 text-center font-mono text-xl tracking-widest"
                            >
                                {{ state.userCode }}
                            </code>
                            <AppButton @click="copyCode(state.userCode)">{{
                                codeCopied ? 'Copied' : 'Copy code'
                            }}</AppButton>
                        </div>
                        <p class="flex items-center gap-2 text-faint">
                            <span class="size-3.5 animate-spin rounded-full border-2 border-line border-t-accent" />
                            Waiting for approval · code expires {{ formatTimeAgo(state.expiresAt) }}
                        </p>
                    </template>

                    <p v-else-if="state.status === 'starting'" class="flex items-center gap-2 text-muted">
                        <span class="size-3.5 animate-spin rounded-full border-2 border-line border-t-accent" />
                        Requesting a device code…
                    </p>

                    <template v-else-if="state.status === 'done'">
                        <p class="text-ok">
                            Authorized the {{ state.connection }} connection with the "{{ state.profile }}" profile.
                        </p>
                        <p
                            v-if="state.warning"
                            class="rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn"
                        >
                            {{ state.warning }}
                        </p>
                        <p v-if="state.organizationError" class="text-xs text-muted">
                            Could not read the organization: {{ state.organizationError }}
                        </p>
                    </template>

                    <p v-else-if="state.status === 'failed'" class="text-err">{{ state.message }}</p>

                    <template v-if="showsForm">
                        <p class="text-muted">
                            Default connection: {{ describeStatus('default') }} · Zoho Projects connection:
                            {{ describeStatus('projects') }}
                        </p>

                        <div>
                            <label for="login-connection" class="mb-1.5 block font-medium">Connection</label>
                            <select id="login-connection" v-model="connection" class="field-input">
                                <option value="default">Default — every command</option>
                                <option value="projects">Zoho Projects only — a separate login</option>
                            </select>
                        </div>

                        <div>
                            <label for="login-profile" class="mb-1.5 block font-medium">Credential profile</label>
                            <select id="login-profile" v-model="selectedProfile" class="field-input">
                                <option v-for="profile in profiles" :key="profile.name" :value="profile.name">
                                    {{ profile.name }} · {{ profile.clientId }}
                                </option>
                                <option :value="newProfileChoice">Create a new profile…</option>
                            </select>
                        </div>

                        <template v-if="creatingProfile">
                            <div>
                                <label for="login-profile-name" class="mb-1.5 block font-medium">Profile name</label>
                                <input id="login-profile-name" v-model="newProfile.name" class="field-input" />
                            </div>
                            <div>
                                <label for="login-client-id" class="mb-1.5 block font-medium">Client ID</label>
                                <input id="login-client-id" v-model="newProfile.clientId" class="field-input" />
                            </div>
                            <div>
                                <label for="login-client-secret" class="mb-1.5 block font-medium">Client Secret</label>
                                <input
                                    id="login-client-secret"
                                    v-model="newProfile.clientSecret"
                                    type="password"
                                    autocomplete="off"
                                    class="field-input"
                                />
                            </div>
                        </template>
                    </template>

                    <p v-if="startError" class="text-err">{{ startError }}</p>
                </div>

                <footer class="flex justify-end gap-2 border-t border-line px-5 py-3.5">
                    <AppButton @click="ui.loginDialogOpen = false">{{
                        state.status === 'done' ? 'Close' : 'Cancel'
                    }}</AppButton>
                    <AppButton v-if="showsForm" variant="primary" :disabled="!canStart" @click="start">
                        {{
                            state.status === 'failed'
                                ? 'Try again'
                                : state.status === 'done'
                                  ? 'Log in again'
                                  : 'Start login'
                        }}
                    </AppButton>
                </footer>
            </div>
        </div>
    </Transition>
</template>
