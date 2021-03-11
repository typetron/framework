import { Migration } from '../../../../Database/Migrations'

export class CreateArticlesTable extends Migration {

    async up() {
        await this.connection.runRaw('CREATE TABLE migrationTestArticles (id INTEGER PRIMARY KEY, title TEXT, content TEXT)')
    }

    async down() {
        await this.connection.runRaw('DROP TABLE migrationTestArticles')
    }
}
