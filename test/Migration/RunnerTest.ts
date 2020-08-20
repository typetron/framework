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
        const migrated = await this.runner.migrate({
            fresh: true
        });

        expect(migrated).equals(true);

        const hasTable = await Query.connection.firstRaw('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'migrationTestUsers\';') as { name: string };

        expect(typeof hasTable).not.equal('undefined');
        expect(hasTable.name).equal('migrationTestUsers');
    }

    @test
    async shouldRollback() {
        await this.runner.migrate({
            fresh: true
        });

        const rollback = await this.runner.rollback({});

        expect(rollback).equals(true);

        const hasTable = await Query.connection.firstRaw('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'migrationTestUsers\';') as { name: string };

        expect(typeof hasTable).equal('undefined');
    }
}
