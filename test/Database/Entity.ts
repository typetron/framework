import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Column, Entity } from '../../Database/Decorators';
import { EntityBase, Query } from '../../Database';
import { anyOfClass, instance, mock, when } from 'ts-mockito';
import { Connection } from '../../Database/Connection';

@suite
class EntityTest {
    private model: User;
    private connection: Connection;

    private data = {
        user1: {
            id: 1,
            name: 'John',
            email: 'john@example.com',
        },
        user2: {
            id: 2,
            name: 'Doe',
            email: 'doe@example.com',
        }
    };

    before() {
        this.model = new User();
        this.connection = mock(Connection);
        Query.connection = instance(this.connection);
    }

    @test
    getsEntityTable() {
        expect(User.getTable()).to.equal('users');
        expect((new User).getTable()).to.equal('users');
    }

    @test
    async selectsEverything() {
        when(this.connection.get(anyOfClass(Query))).thenReturn(Promise.resolve(Object.values(this.data)));
        const users = await User.get();
        this.expectToContain(users[0], this.data.user1);
    }

    private expectToContain(actual: User, expected: {[key: string]: string | number | Date}) {
        const keys = Object.keys(expected);
        keys.forEach(key => {
            expect(actual).to.have.property(key, expected[key]);
        });
    }
}

@Entity<User>({
    table: 'users'
})
class User extends EntityBase {
    @Column()
    id: number;
    @Column()
    name: string;
    @Column()
    email: string;
}
