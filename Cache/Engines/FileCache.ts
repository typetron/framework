import { Inject } from '@Typetron/Container'
import EngineInterface from '../Contracts/EngineInterface'
import { Storage } from '@Typetron/Storage'
import { CacheConfig } from '@Typetron/Framework'
import { createHash } from 'node:crypto'

class FileCache implements EngineInterface {
    @Inject()
    storage: Storage

    public config: any

    constructor(config: CacheConfig['drivers']['file']) {
        this.config = config
    }

    public async get(name: string): Promise<any> {
        if (!(await this.isCacheExist(name))) {
            return null
        }

        const data = await this.read(name)

        if (typeof data === 'boolean') {
            return null
        }

        return data
    }

    public async set(name: string, data: any, duration: number): Promise<any> {
        if (!name) {
            throw new Error('Cache key not provided')
        }

        if (!data) {
            throw new Error('Cache data not provided')
        }

        if (duration > 0) {
            return this.writeWithTime(name, data, duration)
        }

        return this.write(name, data)
    }

    public async flush(): Promise<void> {
        await this.storage.removeDirectory(this.config.path)
    }

    public async delete(key: string): Promise<boolean> {
        return this.deleteFIle(key)
    }

    private async ensureCacheDirectoryExists() {
        if (!(await this.storage.exists('.' + this.config.path))) {
            await this.storage.makeDirectory('.' + this.config.path)
        }
    }

    private async write(key: string, data: any) {
        await this.ensureCacheDirectoryExists()
        await this.storage.put(this.path(key), data)
    }

    private async writeWithTime(key: string, data: any, duration: number) {
        await this.ensureCacheDirectoryExists()

        const currentDate = new Date()
        const futureDate = new Date(currentDate.getTime() + duration * 60000)
        const expiresIn = futureDate.getTime()
        // Append Timestamp to the data

        const newArr: Record<string, unknown> = {}

        newArr['meta'] = {expiresIn}
        newArr['data'] = data

        await this.storage.put(this.path(key), JSON.stringify(newArr))
    }

    private path(key: string): string {
        const hashKey = this.hashKey(key)
        return '.' + this.config.path + '/' + '_' + hashKey + '.cache'
    }

    private async read(key: string): Promise<any> {
        const binaryData = await this.storage.read(this.path(key))

        if (!binaryData.byteLength) {
            return false
        }

        const data = JSON.parse(binaryData.toString())

        const time = data['meta'] && new Date(data['meta']['expiresIn']).getTime()

        if (time < new Date().getTime()) {
            return this.deleteFIle(key)
        }

        return JSON.stringify(data['data'])
    }

    private hashKey(key: string) {
        return createHash('sha1').update(key).digest('hex')
    }

    private async isCacheExist(key: string): Promise<boolean> {
        return await this.storage.exists(this.path(key))
    }

    private async deleteFIle(key: string): Promise<boolean> {
        try {
            if (!(await this.isCacheExist(key))) {
                return false;
            }
            await this.storage.delete(this.path(key));
            return true;
        } catch (e) {
            return false;
        }
    }
}

export default FileCache;
