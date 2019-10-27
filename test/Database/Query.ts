import { expect } from 'chai';
import { suite, test } from '@testdeck/mocha';
import { Query } from '../../Database';
import { anyOfClass, instance, mock, when } from 'ts-mockito';
import { Connection } from '../../Database/Connection';

@suite
class QueryTest {
    private query: Query<User>;

    before() {
        const connection = mock(Connection);
        Query.connection = instance(connection);
        when(connection.get(anyOfClass(Query))).thenCall((query: Query) => {
            return query.toSql();
        });
        this.query = new Query;
    }

    async expectSql() {
        return expect(await this.query.get());
    }

    expectBindings() {
        return expect(this.query.getBindings());
    }

    @test
    async createsInstanceUsingStaticMethod() {
        expect(await Query.table('users').get()).to.equal('SELECT * FROM `users`');
    }

    @test
    async selectsEverything() {
        this.query.table('users');

        (await this.expectSql()).to.equal('SELECT * FROM `users`');
    }

    @test
    async selectSpecificColumns() {
        this.query.table('users').select(['name', 'email']);

        (await this.expectSql()).to.equal('SELECT `name`, `email` FROM `users`');
    }

    @test
    async selectDistinct() {
        this.query.table('users').distinct().select(['name', 'email']);

        (await this.expectSql()).to.equal('SELECT DISTINCT `name`, `email` FROM `users`');
    }

    @test
    async where() {
        this.query.table('users').where('name', '=', 'John');

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE name = ?');
        this.expectBindings().to.deep.equal(['John']);
    }

    @test
    async whereWithDefaultOperator() {
        this.query.table('users').where('name', 'John');

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE name = ?');
        this.expectBindings().to.deep.equal(['John']);
    }

    // @test
    // async whereWithObject() {
    //     this.query.table('users').where({name: 'John', age: 21});
    //
    //     (await this.expectSql()).to.equal('SELECT * FROM users WHERE name = ? AND age = ?');
    //     this.expectBindings().to.deep.equal(['John', 21]);
    // }

    // @test
    // async whereWithArray() {
    //     this.query.table('users').where([
    //         ['name', '=', 'John'],
    //         ['age', '=', 21]
    //     ]);
    //
    //     (await this.expectSql()).to.equal('SELECT * FROM users WHERE name = ? AND age = ?');
    //     this.expectBindings().to.deep.equal(['John', 21]);
    // }

    @test
    async whereOrOperator() {
        this.query.table('users').where('name', 'John').orWhere('age', 21);

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE name = ? OR age = ?');
        this.expectBindings().to.deep.equal(['John', 21]);
    }

    @test
    async whereBetween() {
        this.query.table('users').whereBetween('age', [18, 25]);

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE age BETWEEN ? AND ?');
        this.expectBindings().to.deep.equal([18, 25]);
    }

    @test
    async whereNotBetween() {
        this.query.table('users').whereNotBetween('age', [18, 25]);

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE age NOT BETWEEN ? AND ?');
        this.expectBindings().to.deep.equal([18, 25]);
    }

    @test
    async orWhereBetween() {
        this.query.table('users').where('name', 'John').orWhereBetween('age', [18, 25]);

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE name = ? OR age BETWEEN ? AND ?');
        this.expectBindings().to.deep.equal(['John', 18, 25]);
    }

    @test
    async orWhereNotBetween() {
        this.query.table('users').where('name', 'John').orWhereNotBetween('age', [18, 25]);

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE name = ? OR age NOT BETWEEN ? AND ?');
        this.expectBindings().to.deep.equal(['John', 18, 25]);
    }

    @test
    async whereIn() {
        this.query.table('users').whereIn('age', [18, 25]);

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE age IN (?, ?)');
        this.expectBindings().to.deep.equal([18, 25]);
    }

    @test
    async whereNotIn() {
        this.query.table('users').whereNotIn('age', [18, 25]);

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE age NOT IN (?, ?)');
        this.expectBindings().to.deep.equal([18, 25]);
    }

    @test
    async orWhereIn() {
        this.query.table('users').where('name', 'John').orWhereIn('age', [18, 25]);

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE name = ? OR age IN (?, ?)');
        this.expectBindings().to.deep.equal(['John', 18, 25]);
    }

    @test
    async orWhereNotIn() {
        this.query.table('users').where('name', 'John').orWhereNotIn('age', [18, 25]);

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE name = ? OR age NOT IN (?, ?)');
        this.expectBindings().to.deep.equal(['John', 18, 25]);
    }

    @test
    async whereNull() {
        this.query.table('users').whereNull('age');

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE age IS NULL');
        this.expectBindings().to.deep.equal([]);
    }

    @test
    async whereNotNull() {
        this.query.table('users').whereNotNull('age');

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE age IS NOT NULL');
        this.expectBindings().to.deep.equal([]);
    }

    @test
    async orWhereNull() {
        this.query.table('users').where('name', 'John').orWhereNull('age');

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE name = ? OR age IS NULL');
        this.expectBindings().to.deep.equal(['John']);
    }

    @test
    async orWhereNotNull() {
        this.query.table('users').where('name', 'John').orWhereNotNull('age');

        (await this.expectSql()).to.equal('SELECT * FROM `users` WHERE name = ? OR age IS NOT NULL');
        this.expectBindings().to.deep.equal(['John']);
    }

    // @test
    // async whereParameterGrouping() {
    //     this.query.table('users')
    //         .where('name', 'John')
    //         .where(query => query.where('age', 21).orWhere('role', 'Admin'));
    //
    //     (await this.expectSql()).to.equal('SELECT * FROM users WHERE name = ? and (age = ? or role = ?)');
    //     this.expectBindings().to.deep.equal(['john', 21, 'Admin']);
    // }
    //
    // @test
    // async orderBys() {
    //     this.query.table('users').orderBy('age');
    //     (await this.expectSql()).to.equal('SELECT * FROM users ORDER BY age ASC');
    //
    //     this.query.table('users').orderBy('age', 'DESC');
    //     (await this.expectSql()).to.equal('SELECT * FROM users ORDER BY age DESC');
    //
    //     this.query.table('users').orderBy([['age', 'DESC'], ['email', 'ASC']]);
    //     (await this.expectSql()).to.equal('SELECT * FROM users ORDER BY age DESC, email ASC');
    // }
    //
    // @test
    // async aggregateCount() {
    //     this.query.table('users').count();
    //     (await this.expectSql()).to.equal('SELECT COUNT(*) as aggregate FROM users');
    //
    //     this.new.query.table('users').count('age');
    //     (await this.expectSql()).to.equal('SELECT COUNT(age) as aggregate FROM users');
    // }
    //
    // @test
    // async aggregateMax() {
    //     this.query.table('users').max('age');
    //     (await this.expectSql()).to.equal('SELECT MAX(age) as aggregate FROM users');
    // }

    @test
    async defaultJoin() {
        this.query.table('users').join('pets', 'pets.user_id', '=', 'users.id');
        (await this.expectSql()).to.equal('SELECT * FROM `users` INNER JOIN `pets` ON pets.user_id = users.id');

        // this.new.query.table('users').join('pets', 'pets.user_id', '=', 'users.id').leftJoin('pet_types', 'pet_types.id', '=', 'pets.type_id');
        // (await this.expectSql()).to.equal('SELECT * FROM users INNER JOIN pets ON pets.user_id = users.id LEFT JOIN pet_types ON pet_types.id = pets.type_id');
    }

    @test
    async innerJoin() {
        this.query.table('users').innerJoin('pets', 'pets.user_id', '=', 'users.id');
        (await this.expectSql()).to.equal('SELECT * FROM `users` INNER JOIN `pets` ON pets.user_id = users.id');
    }

    @test
    async leftJoin() {
        this.query.table('users').leftJoin('pets', 'pets.user_id', '=', 'users.id');
        (await this.expectSql()).to.equal('SELECT * FROM `users` LEFT JOIN `pets` ON pets.user_id = users.id');
    }

    @test
    async rightJoin() {
        this.query.table('users').rightJoin('pets', 'pets.user_id', '=', 'users.id');
        (await this.expectSql()).to.equal('SELECT * FROM `users` RIGHT JOIN `pets` ON pets.user_id = users.id');
    }

    @test
    async insertOneRow() {
        this.query.table('users').insert({
            name: 'John',
            email: 'john@example.com'
        });
        (await this.expectSql()).to.equal('INSERT INTO `users` (`name`, `email`) VALUES (?, ?)');
        this.expectBindings().to.deep.equal(['John', 'john@example.com']);
    }

    @test
    async insertManyRow() {
        this.query.table('users').insert([
            {
                name: 'John',
                email: 'john@example.com'
            },
            {
                name: 'Chris',
                email: 'chris@example.com'
            }
        ]);
        (await this.expectSql()).to.equal('INSERT INTO `users` (`name`, `email`) VALUES (?, ?), (?, ?)');
        this.expectBindings().to.deep.equal(['John', 'john@example.com', 'Chris', 'chris@example.com']);
    }

    @test
    async delete() {
        this.query.table('users').delete();

        (await this.expectSql()).to.equal('DELETE FROM `users`');
    }

    @test
    async deletesWithCondition() {
        this.query.table('users').where('name', 'John').delete();

        (await this.expectSql()).to.equal('DELETE FROM `users` WHERE name = ?');
        this.expectBindings().to.deep.equal(['John']);
    }

    @test
    async update() {
        this.query.table('users').update('name', 'John');

        (await this.expectSql()).to.equal('UPDATE `users` SET name = ?');
        this.expectBindings().to.deep.equal(['John']);
    }

    @test
    async updateMultipleColumns() {
        this.query.table('users').update({
            name: 'John',
            age: 21,
        });

        (await this.expectSql()).to.equal('UPDATE `users` SET name = ?, age = ?');
        this.expectBindings().to.deep.equal(['John', 21]);
    }

    @test
    async updateWithCondition() {
        this.query.table('users').where('name', 'John').update('name', 'Doe');
        (await this.expectSql()).to.equal('UPDATE `users` SET name = ? WHERE name = ?');
        this.expectBindings().to.deep.equal(['Doe', 'John']);
    }

    // @test
    // async subSelects() {
    //     this.query.table('users').where('age', query => {
    //         query.max('age').table('users');
    //     });
    //     (await this.expectSql()).to.equal('SELECT * FROM users where age = (SELECT MAX(age) FROM users)');
    // }
}

interface User {
    id: number;
    age: number;
    email: string;
    name: string;
    dateOfBirth: Date;
}
