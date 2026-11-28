/**
 * `import … with { type: 'text' }` yields the file's contents, and `bun build --compile` embeds them
 * into the executable. TypeScript does not know that, so markdown imports are declared as a string.
 */
declare module '*.md' {
    const contents: string
    export default contents
}
