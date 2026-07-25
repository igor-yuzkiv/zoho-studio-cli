export type GitignoreOutcome = 'created' | 'updated' | 'unchanged'

export interface InitializeProjectResult {
    projectPath: string
    gitignoreOutcome: GitignoreOutcome
}

export interface InitializeProjectOptions {
    force?: boolean
}
