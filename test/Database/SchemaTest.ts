import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Connection, Query, Schema } from '../../Database';
import { User } from './Entities/User';
import { Role } from './Entities/Role';

@suite
class SchemaTest {

    async before() {
        Query.connection = new Connection(':memory:');
    }

    @test
    async createsPivotTable() {
        await Schema.synchronize(Query.connection, [User, Role].pluck('metadata'));
        const tableName = [User.getTable(), Role.getTable()].sort().join('_');
        const table = await Query.connection.firstRaw(`SELECT * FROM sqlite_master WHERE name = '${tableName}'`);
        expect(Boolean(table)).to.be.equal(true);
        const tableColumns = await Query.connection.getRaw(`PRAGMA table_info(${tableName})`) as {name: string, type: string}[];
        expect(tableColumns).to.have.length(3);
        expect(tableColumns[0]).to.deep.include({name: 'id', type: 'integer'});
        expect(tableColumns[1]).to.deep.include({name: 'roleId', type: 'integer'});
        expect(tableColumns[2]).to.deep.include({name: 'userId', type: 'integer'});
    }

}
