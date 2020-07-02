import { Migration } from '../../../Migration/Migration';
import { Query } from '../../../Database/Query';

export class CreateUserTable extends Migration {

    public async up(): Promise<unknown> {
        return Query.connection.runRaw('CREATE TABLE migrationTestUsers (id INTEGER PRIMARY KEY, name TEXT, password TEXT)');
    }

    public async down(): Promise<unknown> {
        return Query.connection.runRaw('DROP TABLE migrationTestUsers');
    }
}
