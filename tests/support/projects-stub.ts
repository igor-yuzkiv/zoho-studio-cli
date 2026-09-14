import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import type { ProjectSettings } from '@/settings'

import { type ApiStub, startApiStub } from './api-stub'

export type ProjectsStub = ApiStub

interface ProjectsStubOptions {
    projects?: Partial<Omit<ProjectSettings['projects'], 'baseUrl'>>
    tokens?: Partial<ProjectSettings['auth']['tokens']>
}

/** A project whose Zoho Projects host is a local stub — see `startApiStub`. */
export function startProjectsStub(
    answer: (request: Request) => Response,
    { projects = {}, tokens = {} }: ProjectsStubOptions = {}
): Promise<ProjectsStub> {
    return startApiStub(
        answer,
        (origin) => ({ projects: { baseUrl: origin, portalId: '100', projectId: '200', mdPath: '', ...projects } }),
        tokens
    )
}

/** Answers one Projects list page the way the live API shapes it. */
export function listPage(key: string, items: unknown[], { page = 1, hasNextPage = false } = {}): Response {
    return Response.json({ [key]: items, page_info: { page, per_page: 200, has_next_page: hasNextPage } })
}

interface ProjectsLists {
    milestones?: unknown[]
    taskLists?: unknown[]
    tasks?: unknown[]
    comments?: (taskId: string) => Response
}

/** Routes the four Projects endpoints the pull commands call to the lists a test hands in. */
export function answerProjectsLists({ milestones = [], taskLists = [], tasks = [], comments }: ProjectsLists) {
    return (request: Request): Response => {
        const { pathname } = new URL(request.url)
        const commentsMatch = pathname.match(/\/tasks\/([^/]+)\/comments$/)

        if (commentsMatch) {
            return comments ? comments(commentsMatch[1]!) : listPage('comments', [])
        }

        if (pathname.endsWith('/phases')) {
            return listPage('milestones', milestones)
        }

        if (pathname.endsWith('/tasklists')) {
            return listPage('tasklists', taskLists)
        }

        return listPage('tasks', tasks)
    }
}

export async function readRawDirs(projectPath: string, relativePath = '.'): Promise<string[]> {
    return (await readdir(join(projectPath, 'src/zoho-projects/raw', relativePath)).catch(() => [])).sort()
}
