export type TemplateFileOutcome = 'created' | 'skipped'

export interface TemplateFileResult {
    path: string
    outcome: TemplateFileOutcome
}

export interface InitializeProjectResult {
    templateFiles: TemplateFileResult[]
}

export interface InitializeProjectOptions {
    force?: boolean
}
