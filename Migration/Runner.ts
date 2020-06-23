import * as glob from "glob";
import { Migrate } from './Migrate';
import { Migration } from "./Migration";
import { Connection } from '../Database/Connection';
import {Readable} from 'stream';

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
            })
        });
    }

    protected async createMigrationTable(): Promise<unknown> {
        return this.connection.runRaw(
            `CREATE TABLE IF NOT EXISTS migrate(
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
        return this.connection.runRaw('TRUNCATE TABLE migrate');
    }

    public migrate(options?: MigrateOptions): Readable {
        const runner = this;
        const stream = new Readable();
        runner.createMigrationTable().then(async function () {
            if (options && options.fresh) {
                await runner.clearTable();
            }

            runner.files().then(async function (files: string[]) {
                const migrates = await Migrate.whereIn('name', files).get();

                for (const file of files) {
                    if (!migrates.find((migrate) => {
                        if (migrate.name === file) {
                            return true;
                        }
                        return false;
                    })) {
                        const migration: Migration = require(file);
                        // await migration.up(runner.connection);
                        // stream.push(file);
                        console.log(migration);
                    }
                }
            });

        });

        return stream;
    }

    public _getConnection() {
        return this.connection;
    }

    public rollback() {

    }
}