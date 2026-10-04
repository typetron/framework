import { Filesystem } from '@Typetron/Storage'
import { Constructor } from '@Typetron/Support'
import { Seeder } from './Seeder'

export class SeederManager {
    constructor(
        public storage: Filesystem,
        public directory: string
    ) {}

    async seed() {
        const files = this.storage
            .files(this.directory, true)
            .where('extension', 'ts')
            .whenEmpty(() => console.log('Nothing to seed!'))

        await files.forEachAsync(async file => {
            await this.getSeed(file.path).run()
        })
    }

    private getSeed(path: string): Seeder {
        const module: Record<string, Constructor<Seeder>> = require(path)
        const Class = Object.values(module)[0]
        return new Class()
    }
}
