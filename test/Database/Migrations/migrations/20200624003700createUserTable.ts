import { Migration } from '../../../../Database/Migrations'

export class CreateUserTable extends Migration {

    async up() {
        await this.connection.runRaw('CREATE TABLE migrationTestUsers (id INTEGER PRIMARY KEY, name TEXT, password TEXT)')
    }

    async down() {
        await this.connection.runRaw('DROP TABLE migrationTestUsers')
    }
}
