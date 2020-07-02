import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Runner } from '../../Migration/Runner';
import { Query } from '../../Database/Query';

@suite
class RunnerTest {

    protected runner: Runner;

    async before() {
        this.runner = new Runner({
            databaseFilePath: ':memory:',
            path: './test/Migration/migrations/*.ts'
        });
        Query.connection = this.runner._getConnection();
    }

    @test
    async getFilesByPath() {

        const migrationFiles = await (this.runner as any).files() as string[];

        expect(migrationFiles).to.have.length(1);

    }

    @test
    async shouldMigrate() {
        this.runner.migrate({
            fresh: true
        });
    }
}
