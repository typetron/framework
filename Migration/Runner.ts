import * as glob from 'glob';
import { TypetronMigrations } from './TypetronMigrations';
import { Migration } from './Migration';
import { Connection } from '../Database/Connection';
import * as path from 'path';

interface MigrateOptions {
    fresh?: boolean;
}

interface RollbackOptions {
    all?: boolean;
}

interface Options {
    path?: string;
    databaseFilePath: string;
}

export class Runner {

    constructor(options: Options) {
        if (typeof options.path !== 'undefined') {
            this.path = options.path;
        }

        this.connection = new Connection(options.databaseFilePath);
    }

    protected path = './migrations/*.ts';
    protected connection: Connection;

    protected async files(): Promise<string[]> {
        const runner = this;
        return new Promise(function (resolve, reject) {
            glob(runner.path, function (err: Error | null, matches: string[]) {
                if (err) {
                    reject(err);
                } else {
                    resolve(matches);
                }
            });
        });
    }

    protected async createMigrationTable(): Promise<unknown> {
        return this.connection.runRaw(
            `CREATE TABLE IF NOT EXISTS typetronmigrations(
                id INTEGER PRIMARY KEY,
                name TEXT,
                batch INTEGER,
                time TIMESTAMP
            )`
        ).then(() => {
            return true;
        });
    }


    protected async clearTable(): Promise<unknown> {
        // return Migrate.truncate();
        return TypetronMigrations.newQuery().delete();
    }

    protected async getLastBatchId(): Promise<number> {

        const lastMigration = await TypetronMigrations.orderBy('batch', 'DESC').first();
        return lastMigration ? lastMigration.batch : 0;

    }

    public async migrate(options?: MigrateOptions): Promise<boolean> {
        const runner = this;
        return runner.createMigrationTable().then(async function () {
            if (options && options.fresh) {
                await runner.clearTable();
            }

            return runner.files().then(async function (files: string[]) {
                const migrateQuery = TypetronMigrations.whereIn('name', files);

                const lastBatch = await runner.getLastBatchId();

                const migrates = await migrateQuery.get();

                for (const file of files) {
                    if (!migrates.find((migrate) => {
                        if (migrate.name === file) {
                            return true;
                        }
                        return false;
                    })) {

                        const migration = runner.getMigration(file);

                        console.log(`INFO: Migrating ${file}`);
                        try {
                            await migration.up();
                            await TypetronMigrations.create({
                                name: file,
                                batch: lastBatch + 1,
                                time: new Date()
                            });
                            console.log(`INFO: Migrated ${file}`);
                        } catch (err) {
                            console.log(`ERROR: Failed to run the migration ${file}`);
                            return false;
                        }
                    }
                }
                return true;
            });

        });
    }

    public _getConnection() {
        return this.connection;
    }

    private getMigration(filename: string): Migration {
        const rootPath = process.env.INIT_CWD;
        const migrationPath = path.join(typeof rootPath === 'undefined' ? './' : rootPath, filename);
        const migrationModule: { [x: string]: typeof Migration } = require(migrationPath);
        const MigrationClass = Object.values(migrationModule)[0];
        const migration = new MigrationClass(this._getConnection());

        return migration;
    }

    public async rollback(options: RollbackOptions) {
        this.createMigrationTable();

        let migrations: TypetronMigrations[] = [];

        if (options.all) {

            migrations = await TypetronMigrations.orderBy('time', 'DESC').get();

        } else {
            const lastMigration = await TypetronMigrations.newQuery().orderBy('time', 'DESC').first();

            if (!lastMigration) {
                throw new Error('Can not find any migration to rollback.');
            }

            migrations = await TypetronMigrations.where('batch', lastMigration.batch).orderBy('time', 'DESC').get();
        }

        for (const migrationEntity of migrations) {
            const name = migrationEntity.name;
            const migration = this.getMigration(name);

            console.log(`INFO: Rolling back the ${name} migration.`);
            try {
                await migration.down();
                console.log(`INFO: Reverted ${name} migration.`);
                await migrationEntity.delete();
            } catch (err) {
                console.log(`ERROR: Failed to run the migration ${name}`);
                return false;
            }
        }

        return true;
    }
}
