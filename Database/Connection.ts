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

    async run(query: Query): Promise<void> {
        return new Promise((resolve, reject) => {
            const stack = Error('SQL Error').stack;
            this.db.run(query.toSql(), query.getBindings(), (error, ...args) => {
                if (error) {
                    const e = new Error(`${error} in '${query.toSql()}' `);
                    e.stack = stack;
                    return reject(e);
                }

                resolve();
            });
        });
    }

    async lastInsertedId(): Promise<number | string> {
        return new Promise<number | string>(((resolve, reject) => {
            const stack = Error('SQL Error').stack;
            this.db.get('SELECT last_insert_rowid() as id;', [], (error, lastInsert) => {
                if (error) {
                    const e = new Error(`${error} when trying to get the last inserted id`);
                    e.stack = stack;
                    return reject(e);
                }
                resolve(lastInsert.id);
            });
        }));
    }

    async get<T>(query: Query<T>): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            const stack = Error('SQL Error').stack;
            this.db.all(query.toSql(), query.getBindings(), (error, rows) => {
                if (error) {
                    const e = new Error(`${error} in '${query.toSql()}' `);
                    e.stack = stack;
                    return reject(e);
                }
                resolve(rows);
            });
        });
    }

    async first<T>(query: Query<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const stack = Error('SQL Error').stack;
            this.db.get(query.toSql(), query.getBindings(), (error, rows) => {
                if (error) {
                    const e = new Error(`${error} in '${query.toSql()}' `);
                    e.stack = stack;
                    return reject(e);
                }
                resolve(rows);
            });
        });
    }
}
