import { Archive, Blocks, Box, FileCode, House, ListChecks, SquareFunction, UserCog, Webhook, Workflow, Zap } from '@lucide/vue'
import type { Component } from 'vue'

export const overviewIcon = House

const groupIcons: Record<string, Component> = {
    functions: SquareFunction,
    modules: Box,
    fields: Blocks,
    workflows: Workflow,
    'workflow-actions': Zap,
    webhooks: Webhook,
    'global-picklists': ListChecks,
    profiles: UserCog,
    'client-scripts': FileCode,
    'static-resources': Archive,
}

export function groupIcon(groupId: string): Component {
    return groupIcons[groupId] ?? Blocks
}
