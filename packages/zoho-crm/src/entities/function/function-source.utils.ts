import type { ProjectSettings } from '@zoho-studio/core'
import { toPathSegment } from '@zoho-studio/core'

import {
    functionCodeExtension,
    functionDeployFileSuffix,
    functionsDirName,
    zohoCrmDirName,
    type DelugeFunctionCategory,
} from '../../zoho-crm.config'

type FunctionNamingSettings = ProjectSettings['zohoCrm']['functions']['naming']

const functionNamePattern = /^[A-Za-z][A-Za-z0-9 _-]{2,99}$/
const functionApiNamePattern = /^[A-Za-z][A-Za-z0-9_-]{2,99}$/
const functionDescriptionMaxLength = 3000

/**
 * Lower snake case, so free text such as "Refresh pricing" or "refreshPricing" can become one segment
 * of an API name without losing its word boundaries.
 */
export function toFunctionNameSegment(value: string): string {
    return value
        .trim()
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
}

export function buildFunctionApiName(
    naming: FunctionNamingSettings,
    parts: { category: DelugeFunctionCategory; module?: string; what: string }
): string {
    const categoryPrefix = naming.categoryPrefixes[parts.category] ?? parts.category

    return [naming.vendor, categoryPrefix, parts.module ?? '', parts.what]
        .map(toFunctionNameSegment)
        .filter(Boolean)
        .join('_')
}

/** Each validator answers with what is wrong, or `null`, so a prompt can show the answer as it is. */
export function validateFunctionName(value: string): string | null {
    return functionNamePattern.test(value)
        ? null
        : 'Use 3–100 characters: start with a letter, then letters, digits, spaces, "-" or "_".'
}

export function validateFunctionApiName(value: string): string | null {
    return functionApiNamePattern.test(value)
        ? null
        : 'Use 3–100 characters: start with a letter, then letters, digits, "-" or "_".'
}

export function validateFunctionDescription(value: string): string | null {
    return value.length <= functionDescriptionMaxLength
        ? null
        : `Keep the description within ${functionDescriptionMaxLength} characters.`
}

const stubReturnStatements: Record<string, string> = {
    string: '\treturn "";\n',
    map: '\treturn Map();\n',
}

/**
 * Zoho compiles a Deluge function only when it is declared as `<category>.<display name>`, both in
 * lower snake case — see zoho-findings/functions.md.
 */
export function functionDeclarationName(name: string, category: string): string {
    return `${toDeclarationSegment(category)}.${toDeclarationSegment(name)}`
}

export function buildFunctionStub(definition: {
    name: string
    category: DelugeFunctionCategory
    returnType: string
}): string {
    const body = stubReturnStatements[definition.returnType] ?? ''

    return `${definition.returnType} ${functionDeclarationName(definition.name, definition.category)}()\n{\n${body}}\n`
}

/** Case is ignored because whether Zoho insists on lower case is not confirmed yet. */
export function hasFunctionDeclaration(code: string, declarationName: string): boolean {
    const codeWithoutBlockComments = code.replace(/\/\*[\s\S]*?\*\//g, '')
    const escapedName = declarationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    return new RegExp(`^\\s*\\w+\\s+${escapedName}\\s*\\(`, 'im').test(codeWithoutBlockComments)
}

function toDeclarationSegment(value: string): string {
    return value.toLowerCase().replace(/[ -]/g, '_')
}

export function functionSourceDirPath(apiName: string): string[] {
    return [zohoCrmDirName, functionsDirName, toPathSegment(apiName)]
}

export function functionSourceCodeFilePath(apiName: string): string[] {
    return [...functionSourceDirPath(apiName), `${toPathSegment(apiName)}.${functionCodeExtension}`]
}

export function functionDeployFilePath(apiName: string): string[] {
    return [...functionSourceDirPath(apiName), `${toPathSegment(apiName)}.${functionDeployFileSuffix}`]
}
