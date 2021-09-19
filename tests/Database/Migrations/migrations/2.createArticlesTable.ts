import { Migration } from '../../../../Database/Migrations'

export class CreateArticlesTable extends Migration {

    async up() {
        await this.connection.runRaw('CREATE TABLE migration_test_articles (id INTEGER PRIMARY KEY, title TEXT, content TEXT)')
    }

    async down() {
        await this.connection.runRaw('DROP TABLE migration_test_articles')
    }
}
