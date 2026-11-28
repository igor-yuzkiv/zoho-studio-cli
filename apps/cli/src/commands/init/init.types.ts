export type TemplateFileOutcome = 'created' | 'skipped'

export interface TemplateFileResult {
    path: string
    outcome: TemplateFileOutcome
}

/** `existing` — the folder already sits inside a repository; `unavailable` — git could not run. */
export type ProjectGitOutcome = 'initialized' | 'existing' | 'unavailable'

export interface InitializeProjectResult {
    templateFiles: TemplateFileResult[]
    git: ProjectGitOutcome
}

export interface InitializeProjectOptions {
    force?: boolean
    gitExecutable?: string
}
