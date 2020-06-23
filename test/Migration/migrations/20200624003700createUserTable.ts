import { Migration } from '../../../Migration/Migration';
import {Connection} from '../../../Database/Connection';

export class CreateUserTable implements Migration {

    up(connection: Connection): Promise<unknown> {
        return connection.runRaw('CREATE TABLE migrationTestUsers (id INTEGER PRIMARY KEY, name TEXT, password TEXT)');
    }

    down(connection: Connection): Promise<unknown> {
        return connection.runRaw('DROP TABLE migrationTestUsers');
    }
}