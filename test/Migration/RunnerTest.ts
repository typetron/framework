import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Runner } from '../../Migration/Runner';

@suite
class RunnerTest {

    protected runner: Runner;

    async before() {
        this.runner = new Runner({
            databaseFilePath: ':memory:',
            path: './test/Migration/migrations/*.ts'
        });
    }

    @test
    async getFilesByPath() {

        const runnerProto = await (this.runner as any).files() as string[];

        expect(runnerProto).to.have.length(1);

    }

    @test
    async shouldMigrate() {
        this.runner.migrate({
            fresh: true
        });
    }
}