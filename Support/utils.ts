export function JSONSafeParse<T>(text?: string) {
    try {
        return text ? JSON.parse(text) as T : undefined
    } catch (error) {
        return undefined
    }
}
