import { Database } from 'sqlite3';
import { Query } from './Query';

export class Connection {
    db: Database;

    constructor(databaseFilePath: string) {
        this.db = new Database(databaseFilePath);

        // const con = mysql.createConnection({
        //     host: 'localhost',
        //     user: 'root',
        //     password: 'root',
        //     database: 'carreo_api'
        // });
        //
        // con.connect();
        // this.db = con;

        // this.db.run("INSERT INTO users values(1,'u1')");
        // this.db.run("INSERT INTO users values(2,'u2')");
        // this.db.run("INSERT INTO users values(3,'u3')");
        // this.db.run("INSERT INTO users values(4,'u4')");
        // this.db.run("INSERT INTO users values(5,'u5')");
        // this.execute();
    }

    async run(query: Query): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.db.run(query.toSql(), query.getBindings(), (error, ...args) => {
                if (error) {
                    return reject(new Error(`${error} in '${query.toSql()}'`));
                }

                this.db.get('SELECT last_insert_rowid() as id;', [], (e, lastInsert) => {
                    if (e) {
                        return reject(e);
                    }
                    resolve(lastInsert.id);
                });
            });
        });
    }

    async get<T>(query: Query<T>): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            this.db.all(query.toSql(), query.getBindings(), (error, rows) => {
                if (error) {
                    return reject(new Error(`${error} in '${query.toSql()}'`));
                }
                resolve(rows);
            });
        });
    }

    async first<T>(query: Query<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.db.get(query.toSql(), query.getBindings(), (error, rows) => {
                if (error) {
                    return reject(new Error(`${error} in '${query.toSql()}'`));
                }
                resolve(rows);
            });
        });
    }
}
