import { createProgram } from '@/program'

try {
    await createProgram().parseAsync()
} catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
}
