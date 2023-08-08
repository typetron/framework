import ServiceInterface from '../Contracts/ServiceInterface'
import FileCache from '../Engines/FileCache'

export class FileCacheService extends FileCache implements ServiceInterface {
    // @Inject()
    // config: CacheConfig;

    // constructor(config: CacheConfig["drivers"]["file"]) {
    //   console.log(config, "asasas");
    //   super(config);
    // }

    public async get(name: string): Promise<any> {
        if (!name) {
            return false
        }
        const value = await super.get(name)

        if (!value) {
            return null
        }
        return this.deserialize(value)
    }

    public async has(name: string): Promise<boolean> {
        const value = await this.get(name)

        return !!value
    }

    public async set(
        name: string,
        data: any,
        duration: number = 0
    ): Promise<any> {
        if (name && data) {
            return await super.set(name, this.serialize(data), duration)
        }
    }

    public async delete(name: string): Promise<boolean> {
        if (await this.has(name)) {
            await super.delete(name)
            return true
        }
        return false
    }

    public async flush(): Promise<void> {
        await super.flush()
    }

    public async update(name: string, data: any, duration: number): Promise<any> {
        if (await this.delete(name)) {
            return await this.set(name, data, duration)
        } else {
            return await this.set(name, data, duration)
        }
    }

    private serialize(data: any): any {
        return JSON.stringify(data)
    }

    private deserialize(data: any): any {
        return JSON.parse(data);
    }
}
