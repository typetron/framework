import { Migration } from '../../../../Database/Migrations'

export class CreateUserTable extends Migration {

    async up() {
        await this.connection.runRaw('CREATE TABLE migration_test_users (id INTEGER PRIMARY KEY, name TEXT, password TEXT)')
    }

    async down() {
        await this.connection.runRaw('DROP TABLE migration_test_users')
    }
}
