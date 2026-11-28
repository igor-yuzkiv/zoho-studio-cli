import type { ProjectGitOutcome } from './init.types'

/**
 * Makes the project a git repository, so a pull can be compared with what was there before. A
 * folder already inside a repository is left as it is rather than nested, and a machine without git
 * gets a project anyway — git is what the user installs, not what init depends on.
 */
export function initializeProjectGit(projectPath: string, gitExecutable: string): ProjectGitOutcome {
    const runGit = (args: string[]) =>
        Bun.spawnSync([gitExecutable, ...args], { cwd: projectPath, stdout: 'ignore', stderr: 'ignore' })

    try {
        if (runGit(['rev-parse', '--is-inside-work-tree']).exitCode === 0) {
            return 'existing'
        }

        return runGit(['init', '--quiet']).exitCode === 0 ? 'initialized' : 'unavailable'
    } catch {
        return 'unavailable'
    }
}
