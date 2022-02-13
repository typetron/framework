/* 
1. read seed files from specified directory.
2. execute run method for each seed file.
*/

import { Storage } from "@Typetron/Storage"
import { Constructor } from "@Typetron/Support"
import { Seeder } from "./Seeder"

export class SeederManager {
    constructor(
        public storage: Storage,
        public directory: string
    ) {}

    async seed() {
        const files =  await this.storage.files(this.directory, true)

        files.forEachAsync(async file => {
            await this.getSeed(file.path).run()
        })
    }

    private getSeed(path: string): Seeder {
        const module: Record<string, Constructor<Seeder>> = require(path)
        const Class = Object.values(module)[0]
        return new Class()
    }
}