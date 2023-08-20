export abstract class Cache {
    abstract has(name: string): Promise<boolean>

    abstract get<T>(name: string, defaultValue?: T | (() => T | Promise<T>)): Promise<T | undefined>

    abstract remember<T>(name: string, defaultValue?: T | (() => T | Promise<T>), duration?: number): Promise<T | undefined>

    abstract set(name: string, data: any, duration?: number): Promise<void>

    abstract delete(name: string): Promise<void>

    abstract flush(): Promise<void>
}
