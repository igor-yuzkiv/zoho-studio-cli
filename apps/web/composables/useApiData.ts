import { ref, watch, type Ref, type WatchSource } from 'vue'

import { useProjectStore } from '@web/stores/project.store'

/** Loads data from the API and loads it again whenever a pull finishes or a source changes. */
export function useApiData<TData>(load: () => Promise<TData>, sources: WatchSource[] = []) {
    const projectStore = useProjectStore()
    const data = ref<TData | null>(null) as Ref<TData | null>
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function reload() {
        loading.value = true

        try {
            data.value = await load()
            error.value = null
        } catch (loadError) {
            data.value = null
            error.value = loadError instanceof Error ? loadError.message : String(loadError)
        } finally {
            loading.value = false
        }
    }

    watch([() => projectStore.dataVersion, ...sources], reload, { immediate: true })

    return { data, loading, error, reload }
}
