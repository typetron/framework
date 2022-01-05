import { suite, test } from '@testdeck/mocha'
import { expect } from 'chai'
import { Connection, Entity, EntityConstructor, Query, SqliteDriver } from '../../Database'
import { User } from './Entities/User'
import { EntityQuery } from '../../Database/EntityQuery'
import { Article } from './Entities/Article'
import { Role } from './Entities/Role'

@suite
class EntityTest {
    joe = {
        id: 1,
        name: 'Joe',
        email: 'joe@example.com',
    }

    doe = {
        id: 2,
        name: 'Doe',
        email: 'doe@example.com',
    }

    admin = {
        id: 1,
        name: 'Admin'
    }
    developer = {
        id: 1,
        name: 'Developer'
    }

    data = {
        users: [this.joe, this.doe],
        roles: [this.admin, this.developer],
    }

    async before() {
        Query.connection = new Connection(new SqliteDriver(':memory:'))
        // Query.connection = new Connection(new MysqlDriver({
        //     host: 'localhost', user: 'root', password: 'root', database: 'typetron_test'
        // }))
        await Query.connection.driver.schema.synchronize([User, Article, Role].pluck('metadata'))
    }

    async after() {
        for await (const entity of [User, Article, Role]) {
            await (entity as EntityConstructor<Entity>).truncate()
        }
    }

    expectToContain(actual: User, expected: {[key: string]: string | number | Date}) {
        const keys = Object.keys(expected)
        keys.forEach(key => {
            expect(actual).to.have.property(key, expected[key])
        })
    }

    @test
    fillEntityWhenInstantiating() {
        expect(new User().fill({name: 'Joe'})).to.deep.include({name: 'Joe'})
    }

    @test
    getEntityTable() {
        expect(User.getTable()).to.equal('users')
        expect((new User()).getTable()).to.equal('users')
    }

    @test
    async createsNewQuery() {
        expect(User.newQuery()).to.be.an.instanceof(EntityQuery)
        const user = new User()
        expect(user.newQuery()).to.be.an.instanceof(EntityQuery)
    }

    @test
    async getEveryRecord() {
        await Query.table(User.getTable()).insert([this.joe, this.doe])

        const users = await User.get()

        expect(users).to.have.length(2)

        users.forEach((user, index) => this.expectToContain(user, this.data.users[index]))
    }

    // @test
    // async where() {
    //     const modelMock = mock(User);
    //     const user = instance(modelMock);
    //
    //     const queryMock = mock(EntityQuery);
    //     verify(queryMock.where('name', 'Joe')).once();
    //     when(user.newQuery()).thenReturn(instance(queryMock));
    //
    //     const users = await User.where('name', 'Joe').get();
    //
    //     users.forEach((user, index) => this.expectToContain(user, this.data.users[index]));
    // }
    //
    // @test
    // async whereIn() {
    //     when(this.connection.get(anyOfClass(Query))).thenResolve(this.data.users);
    //
    //     const users = await User.whereIn('name', ['Joe', 'Doe']).get();
    //
    //     users.forEach((user, index) => this.expectToContain(user, this.data.users[index]));
    // }
    //
    @test
    async save() {
        const data = {email: 'tester', name: 'Tester'}
        const user = new User().fill(data)

        this.expectToContain(user, data)
        expect(user.id).to.be.equal(undefined)
        await user.save()
        expect(user.id).to.be.equal(1)
        expect(user.createdAt).to.be.an.instanceOf(Date)
        expect(user.updatedAt).to.be.an.instanceOf(Date)
    }

    @test
    async insertMany() {
        await User.insert([this.joe, this.doe])

        const users = await User.get()
        expect(users).to.have.length(2)
        this.expectToContain(users[0], this.joe)
        this.expectToContain(users[1], this.doe)
    }

    // @test
    // async test0() {
    // const users = await User.get();
    // const users = await User.get('id', 'name');
    // const user = await User.first('id');
    // const user = await User.firstOrNew({name: 'John'}, {email: 'john@example.com'});
    // const user = await User.firstOrCreate({name: 'John'}, {email: 'john@example.com'});
    // const user = await User.find(1);
    // const users = await User.with('articles').get();
    // }

    @test
    async getSpecificColumns() {
        await Query.table(User.getTable()).insert([this.joe])

        const users = await User.get('id', 'name')

        expect(users).to.have.length(1)
        expect(users.first()).to.have.property('name', this.joe.name)
        expect(users.first()).and.to.have.property('id', this.joe.id)
        expect(users.first()).and.to.not.have.property('email')
    }

    @test
    async getFirstRecord() {
        await Query.table(User.getTable()).insert([this.joe, this.doe])

        const user = await User.first() as User

        this.expectToContain(user, this.joe)
    }

    @test
    async getFirstRecordWithSpecificColumns() {
        await Query.table(User.getTable()).insert([this.joe])

        const user = await User.first('id') as User

        expect(user).to.have.property('id', this.joe.id)
        expect(user).to.not.have.property('name')
    }

    @test
    async getFirstRecordOrInstantiateOneIfNot() {
        const a = await User.first()
        const john = await User.firstOrNew({name: 'John'}, {email: 'john@example.com'})

        expect(john).to.have.property('name', 'John')
        expect(john).to.have.property('email', 'john@example.com')
        expect(john).to.not.have.property('id')
        expect(await User.get()).to.have.length(0)
    }

    @test
    async getFirstRecordOrCreateOneIfNot() {
        const john = await User.firstOrCreate({name: 'John'}, {email: 'john@example.com'})

        expect(john).to.have.property('name', 'John')
        expect(john).to.have.property('email', 'john@example.com')
        expect(john).to.have.property('id')
        expect(await User.get()).to.have.length(1)
    }
}
