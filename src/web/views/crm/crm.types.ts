export type ModuleMetadata = {
    api_name: string
    module_name?: string
    plural_label?: string
    singular_label?: string
    generated_type?: string
    modified_time?: string
    [key: string]: unknown
}

export type FieldMetadata = {
    api_name: string
    field_label: string
    data_type: string
    custom_field?: boolean
    system_mandatory?: boolean
    read_only?: boolean
    lookup?: { module?: { api_name?: string } } | null
    pick_list_values?: { display_value: string }[]
    formula?: { return_type?: string } | null
}

export type WorkflowAction = { id: string; name: string; type: string }

export type WorkflowCriterion = {
    comparator?: string
    field?: { api_name?: string }
    value?: unknown
    group_operator?: string
    group?: WorkflowCriterion[]
}

export type WorkflowCondition = {
    id: string
    sequence_number?: number
    instant_actions?: { actions?: WorkflowAction[] } | null
    scheduled_actions?: { execute_after?: unknown; actions?: WorkflowAction[] }[] | null
    criteria_details?: { criteria?: WorkflowCriterion | null } | null
}

export type WorkflowRule = {
    id: string
    name: string
    description?: string | null
    status?: { active?: boolean }
    module?: { api_name?: string }
    execute_when?: { type?: string; details?: Record<string, unknown> }
    conditions?: WorkflowCondition[]
    modified_time?: string
}
