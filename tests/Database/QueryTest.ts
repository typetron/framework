import { expect } from 'chai'
import { suite, test } from '@testdeck/mocha'
import { Connection, Query } from '../../Database'
import { anyOfClass, instance, mock, when } from 'ts-mockito'
import { SqliteDriver } from '@Typetron/Database/Drivers'
import { expectQuery, trimSQL } from '@Typetron/tests/Database/utils'

@suite
class QueryTest {
    connection: Connection
    private query: Query<User>

    before() {
        this.connection = mock(Connection)
        Query.connection = instance(this.connection)
        Query.connection.driver = new SqliteDriver(':memory:')
        when(this.connection.get(anyOfClass(Query))).thenCall((query: Query) => {
            return query.toSQL()
        })
        this.query = new Query()
    }

    async expect() {
        return expect(trimSQL(await this.query.toSQL()))
    }

    expectBindings() {
        return expect(this.query.getBindings())
    }

    @test
    async selectsEverything() {
        expectQuery(Query.table('users')).toEqual('SELECT * FROM users')
    }

    @test
    async selectSpecificColumns() {
        expectQuery(
            Query.table('users').select('name', 'email')
        ).toEqual(
            'SELECT name, email FROM users'
        )
    }

    @test
    async addColumns() {
        expectQuery(
            Query.table('users').addSelect('name', 'email')
        ).toEqual(
            'SELECT name, email FROM users'
        )
    }

    @test
    async selectDistinct() {
        expectQuery(
            Query.table('users').distinct().select('name', 'email')
        ).toEqual(
            'SELECT DISTINCT name, email FROM users'
        )
    }

    @test
    async first() {
        when(this.connection.first(anyOfClass(Query))).thenResolve({name: 'John'})
        const user = await this.query.table('users').first('name');

        (await this.expect()).to.equal(
            'SELECT name FROM users'
        )
        expect(user).to.deep.equal({name: 'John'})
    }

    @test
    async where() {
        const query = Query.table('users').where('name', '=', 'John')

        expectQuery(
            query
        ).toEqual(
            'SELECT * FROM users WHERE name = ?'
        )

        expect(
            query.getBindings()
        ).to.deep.equal(
            ['John']
        )
    }

    @test
    async whereWithDefaultOperator() {
        const query = Query.table('users').where('name', 'John')

        expectQuery(
            query
        ).toEqual(
            'SELECT * FROM users WHERE name = ?'
        )
        expect(
            query.getBindings()
        ).to.deep.equal(
            ['John']
        )
    }

    // @test
    // async whereWithObject() {
    //     Query.table('users').where({name: 'John', age: 21});
    //
    //     (await this.expectSql()).to.equal('SELECT * FROM users WHERE name = ? AND age = ?');
    //     this.expectBindings().to.deep.equal(['John', 21]);
    // }

    // @test
    // async whereWithArray() {
    //     Query.table('users').where([
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

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE name = ? OR age = ?'
        )
        this.expectBindings().to.deep.equal(['John', 21])
    }

    @test
    async whereBetween() {
        this.query.table('users').whereBetween('age', [18, 25]);

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE age BETWEEN ? AND ?'
        )
        this.expectBindings().to.deep.equal([18, 25])
    }

    @test
    async whereNotBetween() {
        this.query.table('users').whereNotBetween('age', [18, 25]);

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE age NOT BETWEEN ? AND ?'
        )
        this.expectBindings().to.deep.equal([18, 25])
    }

    @test
    async orWhereBetween() {
        this.query.table('users').where('name', 'John').orWhereBetween('age', [18, 25]);

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE name = ? OR age BETWEEN ? AND ?'
        )
        this.expectBindings().to.deep.equal(['John', 18, 25])
    }

    @test
    async orWhereNotBetween() {
        this.query.table('users').where('name', 'John').orWhereNotBetween('age', [18, 25]);

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE name = ? OR age NOT BETWEEN ? AND ?'
        )
        this.expectBindings().to.deep.equal(['John', 18, 25])
    }

    @test
    async whereIn() {
        this.query.table('users').whereIn('age', [18, 25]);

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE age IN (?, ?)'
        )
        this.expectBindings().to.deep.equal([18, 25])
    }

    @test
    async whereNotIn() {
        this.query.table('users').whereNotIn('age', [18, 25]);

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE age NOT IN (?, ?)'
        )
        this.expectBindings().to.deep.equal([18, 25])
    }

    @test
    async orWhereIn() {
        this.query.table('users').where('name', 'John').orWhereIn('age', [18, 25]);

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE name = ? OR age IN (?, ?)'
        )
        this.expectBindings().to.deep.equal(['John', 18, 25])
    }

    @test
    async orWhereNotIn() {
        this.query.table('users').where('name', 'John').orWhereNotIn('age', [18, 25]);

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE name = ? OR age NOT IN (?, ?)'
        )
        this.expectBindings().to.deep.equal(['John', 18, 25])
    }

    @test
    async whereNull() {
        this.query.table('users').whereNull('age');

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE age IS NULL'
        )
        this.expectBindings().to.deep.equal([])
    }

    @test
    async andWhereNull() {
        this.query.table('users').andWhereNull('age');

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE age IS NULL'
        )
        this.expectBindings().to.deep.equal([])
    }

    @test
    async whereNotNull() {
        this.query.table('users').whereNotNull('age');

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE age IS NOT NULL'
        )
        this.expectBindings().to.deep.equal([])
    }

    @test
    async andWhereNotNull() {
        this.query.table('users').andWhereNotNull('age');

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE age IS NOT NULL'
        )
        this.expectBindings().to.deep.equal([])
    }

    @test
    async orWhereNull() {
        this.query.table('users').where('name', 'John').orWhereNull('age');

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE name = ? OR age IS NULL'
        )
        this.expectBindings().to.deep.equal(['John'])
    }

    @test
    async orWhereNotNull() {
        this.query.table('users').where('name', 'John').orWhereNotNull('age');

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE name = ? OR age IS NOT NULL'
        )
        this.expectBindings().to.deep.equal(['John'])
    }

    @test
    async orWhereLike() {
        this.query.table('users').where('age', 18).orWhereLike('name', '%John');

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE age = ? OR name LIKE ?'
        )
        this.expectBindings().to.deep.equal([18, '%John'])
    }

    @test
    async orWhereNotLike() {
        this.query.table('users').where('age', 18).orWhereNotLike('name', '%John');

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE age = ? OR name NOT LIKE ?'
        )
        this.expectBindings().to.deep.equal([18, '%John'])
    }

    @test
    async andWhereIn() {
        this.query.table('users').where('age', 18).andWhereIn('name', ['John', 'Doe']);

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE age = ? AND name IN (?, ?)'
        )
        this.expectBindings().to.deep.equal([18, 'John', 'Doe'])
    }

    @test
    async andWhereNotIn() {
        this.query.table('users').where('age', 18).andWhereNotIn('name', ['John', 'Doe']);

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE age = ? AND name NOT IN (?, ?)'
        )
        this.expectBindings().to.deep.equal([18, 'John', 'Doe'])
    }

    @test
    async whereLike() {
        this.query.table('users').whereLike('name', '%John');

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE name LIKE ?'
        )
        this.expectBindings().to.deep.equal(['%John'])
    }

    @test
    async andWhere() {
        this.query.table('users').where('name', 'John').andWhere('age', 18);

        (await this.expect()).to.equal(
            'SELECT * FROM users WHERE name = ? AND age = ?'
        )
        this.expectBindings().to.deep.equal(['John', 18])
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

    @test
    async orderBys() {
        this.query.table('users').orderBy('age');
        (await this.expect()).to.equal(
            'SELECT * FROM users ORDER BY age DESC'
        )

        this.query.table('users').orderBy('age', 'ASC');
        (await this.expect()).to.equal(
            'SELECT * FROM users ORDER BY age ASC'
        )

        this.query.table('users').orderBy([['age', 'DESC'], ['email', 'ASC']]);
        (await this.expect()).to.equal(
            'SELECT * FROM users ORDER BY age DESC, email ASC'
        )
    }

    @test
    async groupBy() {
        this.query.table('users').groupBy('name');
        (await this.expect()).to.equal(
            'SELECT * FROM users GROUP BY name'
        )

        this.query.table('users').groupBy('city', 'country');
        (await this.expect()).to.equal(
            'SELECT * FROM users GROUP BY city, country'
        )
    }

    @test
    async aggregateSelectCount() {
        const query = await this.query.table('users').selectCount().get() as unknown as string
        expectQuery(query).toEqual('SELECT COUNT(*) as aggregate FROM users')
    }

    @test
    async aggregateCount() {
        when(this.connection.first(anyOfClass(Query))).thenCall((query: Query) => {
            return {aggregate: trimSQL(query.toSQL())}
        })

        expect(await this.query.table('users').count()).to.equal('SELECT COUNT(*) as aggregate FROM users')
    }

    @test
    async aggregateMax() {
        const query = await this.query.table('users').max('age') as unknown as string
        expectQuery(query).toEqual('SELECT MAX(age) as aggregate FROM users')
    }

    @test
    async limit() {
        const query = await this.query.table('users').limit(10, 20).get() as unknown as string
        expectQuery(
            query
        ).toEqual(
            'SELECT * FROM users LIMIT 10, 20'
        )
    }

    //
    // @test
    // async aggregateMax() {
    //     this.query.table('users').max('age');
    //     (await this.expectSql()).to.equal('SELECT MAX(age) as aggregate FROM users');
    // }

    @test
    async defaultJoin() {
        this.query.table('users').join('pets', 'pets.user_id', '=', 'users.id');
        (await this.expect()).to.equal(
            'SELECT * FROM users INNER JOIN pets ON pets.user_id = users.id'
        )

        // this.new.query.table('users')
        // .join('pets', 'pets.user_id', '=', 'users.id')
        // .leftJoin('pet_types', 'pet_types.id', '=', 'pets.type_id');
        // (await this.expectSql()).to
        // .equal('SELECT * FROM users INNER JOIN pets ON pets.user_id = users.id LEFT JOIN pet_types ON pet_types.id = pets.type_id');
    }

    @test
    async innerJoin() {
        this.query.table('users').innerJoin('pets', 'pets.user_id', '=', 'users.id');
        (await this.expect()).to.equal(
            'SELECT * FROM users INNER JOIN pets ON pets.user_id = users.id'
        )
    }

    @test
    async leftJoin() {
        this.query.table('users').leftJoin('pets', 'pets.user_id', '=', 'users.id');
        (await this.expect()).to.equal(
            'SELECT * FROM users LEFT JOIN pets ON pets.user_id = users.id'
        )
    }

    @test
    async rightJoin() {
        this.query.table('users').rightJoin('pets', 'pets.user_id', '=', 'users.id');
        (await this.expect()).to.equal(
            'SELECT * FROM users RIGHT JOIN pets ON pets.user_id = users.id'
        )
    }

    @test
    async insertOneRow() {
        this.query.table('users').insert({
            name: 'John',
            email: 'john@example.com'
        });
        (await this.expect()).to.equal(
            'INSERT INTO users (name, email) VALUES (?, ?)'
        )
        this.expectBindings().to.deep.equal(['John', 'john@example.com'])
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
        (await this.expect()).to.equal(
            'INSERT INTO users (name, email) VALUES (?, ?), (?, ?)'
        )
        this.expectBindings().to.deep.equal(['John', 'john@example.com', 'Chris', 'chris@example.com'])
    }

    @test
    async delete() {
        this.query.table('users').delete();

        (await this.expect()).to.equal(
            'DELETE FROM users'
        )
    }

    @test
    async deletesWithCondition() {
        this.query.table('users').where('name', 'John').delete();

        (await this.expect()).to.equal(
            'DELETE FROM users WHERE name = ?'
        )
        this.expectBindings().to.deep.equal(['John'])
    }

    @test
    async update() {
        this.query.table('users').update('name', 'John');

        (await this.expect()).to.equal(
            'UPDATE users SET name = ?'
        )
        this.expectBindings().to.deep.equal(['John'])
    }

    @test
    async updateMultipleColumns() {
        this.query.table('users').update({
            name: 'John',
            age: 21,
        });

        (await this.expect()).to.equal(
            'UPDATE users SET name = ?, age = ?'
        )
        this.expectBindings().to.deep.equal(['John', 21])
    }

    @test
    async updateWithCondition() {
        this.query.table('users').where('name', 'John').update('name', 'Doe');
        (await this.expect()).to.equal(
            'UPDATE users SET name = ? WHERE name = ?'
        )
        this.expectBindings().to.deep.equal(['Doe', 'John'])
    }

    @test
    async subSelectWhereWithFunction() {
        const query = Query.table('users').where('id', q => {
            q.select('userId').from('roles').where('id', 1)
        })
        expect(trimSQL(query.toSQL())).to.equal('SELECT * FROM users WHERE id = (SELECT userId FROM roles WHERE id = ?)')
        expect(query.getBindings()).to.deep.equal([1])
    }

    @test
    async subSelectWhereWithDirectQuery() {
        const query = Query.table('users').where('id', new Query().select('userId').from('roles').where('id', 1))
        expect(trimSQL(query.toSQL())).to.equal('SELECT * FROM users WHERE id = (SELECT userId FROM roles WHERE id = ?)')
        expect(query.getBindings()).to.deep.equal([1])
    }

    @test
    async subSelectWhereInWithFunction() {
        const query = Query.table('users').whereIn('id', q => {
            q.select('userId').from('roles').where('id', 1)
        })
        expect(trimSQL(query.toSQL())).to.equal('SELECT * FROM users WHERE id IN (SELECT userId FROM roles WHERE id = ?)')
        expect(query.getBindings()).to.deep.equal([1])
    }

    @test
    async subSelectWhereInWithDirectQuery() {
        const query = Query.table('users').whereIn('id', new Query().select('userId').from('roles').where('id', 1))
        expect(trimSQL(query.toSQL())).to.equal('SELECT * FROM users WHERE id IN (SELECT userId FROM roles WHERE id = ?)')
        expect(query.getBindings()).to.deep.equal([1])
    }
}

interface User {
    id: number;
    age: number;
    email: string;
    name: string;
    dateOfBirth: Date;
}
