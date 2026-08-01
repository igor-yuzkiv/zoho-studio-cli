export function resolveFieldFileName(fieldApiName: string): string {
    return `${fieldApiName.replace(/[/\\\0]/g, '_')}.json`
}
