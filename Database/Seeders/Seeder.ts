/* 
1. read seed files from specified directory.
2. execute run method for each seed file.
*/

import { Connection } from '@Typetron/Database'
import { Storage } from "@Typetron/Storage"
import { Constructor } from "@Typetron/Support"
import { Seed } from "./Seed"

export class Seeder {
    constructor(
        public storage: Storage,
        public connection: Connection,
        public directory: string
    ) {}

    async seed() {
        const files =  await this.storage.files(this.directory, true)

        files.forEachAsync(async file => {
            await this.getSeed(file.path).run()
        })
    }

    private getSeed(path: string): Seed {
        const module: Record<string, Constructor<Seed>> = require(path)
        const Class = Object.values(module)[0]
        return new Class(this.connection)
    }
}