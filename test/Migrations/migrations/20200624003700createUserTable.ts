import { Migration } from '../../../Database/Migrations/Migration'

export class CreateUserTable extends Migration {

    public async up(): Promise<unknown> {
        return this.connection.runRaw('CREATE TABLE migrationTestUsers (id INTEGER PRIMARY KEY, name TEXT, password TEXT)')
    }

    public async down(): Promise<unknown> {
        return this.connection.runRaw('DROP TABLE migrationTestUsers')
    }
}
