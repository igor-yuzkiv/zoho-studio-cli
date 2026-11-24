<script setup lang="ts">
import type { WidgetCall, WidgetSession, WidgetSummary } from '@cli/commands/browser/browser.types'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { api } from '@web/api/api.client'
import AppButton from '@web/components/AppButton.vue'
import EmptyState from '@web/components/EmptyState.vue'

// Must match widgetHarnessMessageSource and widgetHarnessControlSource in @zoho-studio/zoho-crm/widget.
const harnessMessageSource = 'zoho-studio-widget-harness'
const harnessControlSource = 'zoho-studio-widget-control'
const eventNames = ['Notify', 'NotifyAndWait', 'ContextUpdate', 'DialerActive', 'Dial', 'PageLoad']

const widgets = ref<WidgetSummary[] | null>(null)
const loadError = ref<string | null>(null)
const selected = ref<WidgetSummary | null>(null)
const scenario = ref('')
const session = ref<WidgetSession | null>(null)
const status = ref<{ kind: 'ready' | 'error'; message: string } | null>(null)
const calls = ref<WidgetCall[]>([])
const expandedCall = ref<number | null>(null)
const eventName = ref(eventNames[0])
const eventData = ref('{}')
const eventError = ref<string | null>(null)
const harness = ref<HTMLIFrameElement | null>(null)

function select(widget: WidgetSummary) {
    selected.value = widget
    scenario.value = widget.defaultScenario ?? widget.scenarios[0] ?? ''
    session.value = null
}

async function open() {
    if (!selected.value) return

    calls.value = []
    status.value = null
    expandedCall.value = null
    session.value = await api.openWidgetSession({ widget: selected.value.name, scenario: scenario.value || undefined })
}

function onHarnessMessage(event: MessageEvent) {
    const message = event.data

    if (!session.value || event.origin !== session.value.origin || message?.source !== harnessMessageSource) return
    if (message.sessionId !== session.value.id) return

    if (message.type === 'call') calls.value.push(message.payload as WidgetCall)
    if (message.type === 'ready') status.value = { kind: 'ready', message: 'Widget registered with the SDK' }
    if (message.type === 'error') status.value = { kind: 'error', message: message.payload.message }
}

function sendEvent() {
    eventError.value = null

    try {
        const data = JSON.parse(eventData.value || '{}')
        harness.value?.contentWindow?.postMessage(
            { source: harnessControlSource, type: 'event', name: eventName.value, data },
            session.value!.origin
        )
    } catch {
        eventError.value = 'Event data must be JSON.'
    }
}

onMounted(async () => {
    window.addEventListener('message', onHarnessMessage)

    try {
        widgets.value = await api.getWidgets()
        const [first] = widgets.value
        if (first) select(first)
    } catch (error) {
        loadError.value = error instanceof Error ? error.message : String(error)
    }
})

onBeforeUnmount(() => window.removeEventListener('message', onHarnessMessage))
</script>

<template>
    <EmptyState v-if="loadError" title="Widgets could not be read" :message="loadError" />
    <EmptyState
        v-else-if="widgets && widgets.length === 0"
        title="No widgets yet"
        message="Describe one in widgets/<name>/widget.json, or run: zoho-studio z-crm:widgets:make --name=<name> --url=<address>"
    />
    <div v-else-if="widgets" class="grid h-full min-h-0 grid-cols-[14rem_1fr_22rem]">
        <nav class="min-h-0 overflow-y-auto border-r border-line bg-surface p-2" aria-label="Widgets">
            <button
                v-for="widget in widgets"
                :key="widget.name"
                type="button"
                class="w-full rounded-md px-2 py-1.5 text-left hover:bg-hover"
                :class="selected?.name === widget.name && '!bg-accent !text-white'"
                @click="select(widget)"
            >
                <div class="truncate font-medium">{{ widget.name }}</div>
                <div class="truncate text-xs opacity-70">{{ widget.location ?? widget.url }}</div>
            </button>
        </nav>

        <section class="flex min-h-0 flex-col">
            <div v-if="selected" class="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2">
                <span class="font-medium">{{ selected.name }}</span>
                <span class="truncate font-mono text-xs text-muted">{{ selected.url }}</span>
                <label class="ml-auto flex items-center gap-1.5 text-xs text-muted">
                    Scenario
                    <select v-model="scenario" class="h-7 rounded-md border border-line bg-surface px-1.5 text-[13px]">
                        <option value="">none (defaults only)</option>
                        <option v-for="name in selected.scenarios" :key="name" :value="name">{{ name }}</option>
                    </select>
                </label>
                <AppButton variant="primary" size="sm" @click="open">{{ session ? 'Reopen' : 'Open' }}</AppButton>
            </div>
            <div
                v-if="status"
                class="border-b border-line px-4 py-1.5 text-xs"
                :class="status.kind === 'error' ? 'bg-red-50 text-red-800' : 'text-muted'"
            >
                {{ status.message }}
            </div>
            <iframe
                v-if="session"
                :key="session.id"
                ref="harness"
                :src="session.url"
                class="min-h-0 w-full flex-1 border-0 bg-white"
                :title="`${selected?.name} widget`"
            />
            <EmptyState
                v-else
                title="Open the widget"
                message="It runs at its own address; Zoho Studio plays Zoho CRM around it and answers the SDK from the scenario, pulled metadata and fixtures."
            />
        </section>

        <aside class="flex min-h-0 flex-col border-l border-line bg-surface" aria-label="SDK calls">
            <div class="border-b border-line px-3 py-2 text-xs font-semibold tracking-wider text-faint uppercase">
                SDK calls · {{ calls.length }}
            </div>
            <ol class="min-h-0 flex-1 overflow-y-auto font-mono text-xs">
                <li v-for="(call, index) in calls" :key="index" class="border-b border-line">
                    <button
                        type="button"
                        class="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-hover"
                        @click="expandedCall = expandedCall === index ? null : index"
                    >
                        <span class="size-1.5 shrink-0 rounded-full" :class="call.ok ? 'bg-green-600' : 'bg-red-600'" />
                        <span class="truncate">{{ call.method }}</span>
                        <span class="ml-auto shrink-0 opacity-60">{{ call.at.slice(11, 19) }}</span>
                    </button>
                    <pre
                        v-if="expandedCall === index"
                        class="max-h-80 overflow-auto bg-hover px-3 py-2 whitespace-pre-wrap"
                        >{{
                            JSON.stringify(
                                {
                                    args: call.args,
                                    [call.ok ? 'response' : 'error']: call.ok ? call.response : call.error,
                                },
                                null,
                                2
                            )
                        }}</pre>
                </li>
                <li v-if="calls.length === 0" class="px-3 py-3 font-sans text-muted">No calls yet.</li>
            </ol>
            <form v-if="session" class="flex flex-col gap-1.5 border-t border-line p-3" @submit.prevent="sendEvent">
                <div class="text-xs font-semibold tracking-wider text-faint uppercase">Send an event</div>
                <select v-model="eventName" class="h-7 rounded-md border border-line bg-surface px-1.5 text-[13px]">
                    <option v-for="name in eventNames" :key="name" :value="name">{{ name }}</option>
                </select>
                <textarea
                    v-model="eventData"
                    rows="3"
                    class="rounded-md border border-line bg-surface p-1.5 font-mono text-xs"
                    aria-label="Event data (JSON)"
                />
                <p v-if="eventError" class="text-xs text-red-700">{{ eventError }}</p>
                <AppButton size="sm" @click="sendEvent">Send</AppButton>
            </form>
        </aside>
    </div>
</template>
