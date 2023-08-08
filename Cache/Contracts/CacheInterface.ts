interface CacheInterface {
    get(name: string): Promise<any>

    set(name: string, data: any, duration: number): Promise<any>

    forever(name: string, data: any): Promise<any>

    update(name: string, data: any, duration?: number): Promise<any>

    delete(name: string): Promise<Boolean>

    remember(name: string, minutes: number, callback: Function): Promise<any>

    rememberForever(name: string, callback: Function): Promise<any>

    many(keys: Array<string>): Promise<object>

    setMany(data: object, minutes: number): Promise<any>

    flush(): Promise<void>
}

export default CacheInterface
