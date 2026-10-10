import {
    Archive,
    Blocks,
    Box,
    Bug,
    FileCode,
    Flag,
    House,
    ListChecks,
    ListTodo,
    SquareCheck,
    SquareFunction,
    Webhook,
    Workflow,
    Zap,
} from '@lucide/vue'
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
    'client-scripts': FileCode,
    'static-resources': Archive,
    milestones: Flag,
    'task-lists': ListTodo,
    tasks: SquareCheck,
    issues: Bug,
}

export function groupIcon(groupId: string): Component {
    return groupIcons[groupId] ?? Blocks
}
