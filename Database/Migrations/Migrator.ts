import { MigrationHistory } from './MigrationHistory'
import { Migration } from './Migration'
import * as path from 'path'
import { File, Storage } from '@Typetron/Storage'
import { Connection, Schema } from '@Typetron/Database'
import { Constructor } from '@Typetron/Support'

interface MigrateOptions {
    fresh?: boolean;
}

interface RollbackOptions {
    all?: boolean;
}

export class Migrator {

    constructor(
        protected storage: Storage,
        protected connection: Connection,
        protected directory: string
    ) {}

    async files(): Promise<File[]> {
        return this.storage.files(this.directory, true)
    }

    protected async createMigrationTable(): Promise<void> {
        await Schema.synchronize(this.connection, [MigrationHistory].pluck('metadata'))
    }

    protected async clearTable(): Promise<unknown> {
        // return MigrationHistory.truncate();
        return MigrationHistory.delete()
    }

    protected async getLastBatchId(): Promise<number> {
        const lastMigration = await MigrationHistory.orderBy('batch', 'DESC').first()
        return lastMigration?.batch ?? 0
    }

    public async migrate(options?: MigrateOptions): Promise<boolean> {
        await this.createMigrationTable()

        if (options?.fresh) {
            await this.clearTable()
        }

        const lastBatch = await this.getLastBatchId()
        const files = await this.files()
        const migrates = await MigrationHistory.whereIn('name', files.pluck('name')).get()

        for (const file of files) {
            if (!migrates.findWhere('name', file.name)) {
                const migration = this.getMigration(file.path)

                console.log(`INFO: Migrating '${file.name}'`)
                try {
                    await migration.up()
                    await MigrationHistory.create({
                        name: file,
                        batch: lastBatch + 1,
                        time: new Date()
                    })
                    console.log(`INFO: Migrated '${file.name}'`)
                } catch (err) {
                    console.log(`ERROR: Failed to run the migration from '${file.name}'`)
                    return false
                }
            }
        }
        return true
    }

    private getMigration(migrationFilePath: string): Migration {
        const migrationModule: Record<string, Constructor<Migration>> = require(migrationFilePath)
        const MigrationClass = Object.values(migrationModule)[0]
        return new MigrationClass(this.connection)
    }

    public async rollback(options?: RollbackOptions) {
        await this.createMigrationTable()

        let migrations: MigrationHistory[] = []

        if (options?.all) {
            migrations = await MigrationHistory.orderBy('time', 'DESC').get()
        } else {
            const lastMigration = await MigrationHistory.newQuery().orderBy('time', 'DESC').first()

            if (!lastMigration) {
                throw new Error('Can not find any migration to rollback.')
            }

            migrations = await MigrationHistory.where('batch', lastMigration.batch).orderBy('time', 'DESC').get()
        }

        for (const migrationEntity of migrations) {
            const name = migrationEntity.name
            const migration = this.getMigration(path.join(this.directory, name))

            console.log(`INFO: Rolling back the '${name}' migration.`)
            try {
                await migration.down()
                console.log(`INFO: Reverted '${name}' migration.`)
                await migrationEntity.delete()
            } catch (err) {
                console.log(`ERROR: Failed to run the migration '${name}'`)
                return false
            }
        }

        return true
    }
}
