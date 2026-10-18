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

/** Lower snake case, so free text such as "Refresh pricing" can become one segment of an API name. */
export function toFunctionNameSegment(value: string): string {
    return value
        .trim()
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
 * lower snake case, so the stub derives the declaration rather than asking for it.
 */
export function buildFunctionStub(definition: {
    name: string
    category: DelugeFunctionCategory
    returnType: string
}): string {
    const declarationName = `${toDeclarationSegment(definition.category)}.${toDeclarationSegment(definition.name)}`
    const body = stubReturnStatements[definition.returnType] ?? ''

    return `${definition.returnType} ${declarationName}()\n{\n${body}}\n`
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
