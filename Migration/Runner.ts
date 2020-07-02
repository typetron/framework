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

    public async migrate(options?: MigrateOptions): Promise<boolean> {
        const runner = this;
        return runner.createMigrationTable().then(async function () {
            if (options && options.fresh) {
                await runner.clearTable();
            }

            return runner.files().then(async function (files: string[]) {
                const migrateQuery = TypetronMigrations.whereIn('name', files);

                const lastMigration = await  TypetronMigrations.orderBy('batch', 'DESC').limit(1).get();
                const lastBatch = lastMigration[0] ? lastMigration[0].batch : 0;

                const migrates = await migrateQuery.get();
                const rootPath = process.env.INIT_CWD;
                for (const file of files) {
                    if (!migrates.find((migrate) => {
                        if (migrate.name === file) {
                            return true;
                        }
                        return false;
                    })) {
                        const migrationPath = path.join(typeof rootPath === 'undefined' ? './' : rootPath, file);
                        const migrationModule: { [x: string]: typeof Migration } = require(migrationPath);
                        const MigrationClass = Object.values(migrationModule)[0];
                        const migration = new MigrationClass(runner._getConnection());

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

    public rollback() {

    }
}
