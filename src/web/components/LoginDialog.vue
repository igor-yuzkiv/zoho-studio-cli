<script setup lang="ts">
import { computed, ref } from 'vue'

import { useProjectStore } from '@web/stores/project.store'
import { useUiStore } from '@web/stores/ui.store'
import { formatTimeAgo } from '@web/utils/time.utils'

import AppButton from './AppButton.vue'

const ui = useUiStore()
const projectStore = useProjectStore()
const startError = ref<string | null>(null)
const codeCopied = ref(false)

const state = computed(() => projectStore.loginState)
const inProgress = computed(() => state.value.status === 'starting' || state.value.status === 'waiting')

async function start() {
    startError.value = null

    try {
        await projectStore.startLogin()
    } catch (error) {
        startError.value = error instanceof Error ? error.message : String(error)
    }
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
                        in the project settings.
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
                        <p class="text-ok">Authorized. The tokens are stored in the project settings.</p>
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

                    <p v-else class="text-muted">
                        Project status:
                        {{
                            projectStore.project?.auth === 'authorized' ? 'a refresh token is stored' : 'not logged in'
                        }}.
                    </p>

                    <p v-if="startError" class="text-err">{{ startError }}</p>
                </div>

                <footer class="flex justify-end gap-2 border-t border-line px-5 py-3.5">
                    <AppButton @click="ui.loginDialogOpen = false">{{
                        state.status === 'done' ? 'Close' : 'Cancel'
                    }}</AppButton>
                    <AppButton v-if="!inProgress && state.status !== 'done'" variant="primary" @click="start">
                        {{ state.status === 'failed' ? 'Try again' : 'Start login' }}
                    </AppButton>
                </footer>
            </div>
        </div>
    </Transition>
</template>
