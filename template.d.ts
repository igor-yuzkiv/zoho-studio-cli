/**
 * `import … with { type: 'file' }` yields the path of the file, and `bun build --compile` embeds
 * the file itself into the executable. TypeScript knows neither, so the template files are declared
 * here as what they resolve to at runtime: a path.
 */
declare module '../../../template/*' {
    const embeddedFilePath: string
    export default embeddedFilePath
}
