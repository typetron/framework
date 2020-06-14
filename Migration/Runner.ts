import * as glob from "glob";
import { Migration } from "./Migration";

interface MigrateOptions {
    fresh: boolean;
}

export class Runner {

    protected path: string = "migrations/**.ts";

    protected async files(): Promise<string[]> {
        const runner = this;
        return new Promise(function(resolve, reject){
            glob(runner.path, function(err: Error|null, matches:string[]){
                if(err){
                    reject(err);
                } else {
                    resolve(matches);
                }
            })
        });
    }

    protected async createMigrationTable(): Promise<boolean> {
        return new Promise(function (resolve, reject){
            // Create if exists query
            resolve(true)
        });
    }


    protected async clearTable(): Promise<boolean> {
        return new Promise(function (resolve, reject){
            // Truncate Table query
            resolve(true);
        });
    }

    public async migrate(options: MigrateOptions) : Promise<boolean> {
        const runner = this;
        return new Promise(async function (resolve, reject){
            runner.createMigrationTable().then(async function(created: boolean){
                if(options.fresh){
                    const clearTable = await runner.clearTable();
                    if(!clearTable){
                        reject(new Error("Can not clear the migration table"))
                    }
                }

                runner.files().then(async function(files: string[]){
                    for(const file of files){
                        const migration: Migration = require(file);

                        await migration.up();
                    }
                })

            });
        })
    }

    public rollback() {

    }
}