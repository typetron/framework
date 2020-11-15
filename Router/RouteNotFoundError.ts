export class RouteNotFoundError extends Error {
    constructor(path: string) {
        super(`Route '${path}' not found`)
    }
}
