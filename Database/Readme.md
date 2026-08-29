# Database

- [Introduction](#introduction)
- [Configuration](#configuration)
- [Queries and Entities](#queries-and-entities)
- [Relationships](#relationships)
- [Migrations and Seeders](#migrations-and-seeders)

## Introduction

The Database module contains Typetron's connection layer, SQL query builder, schema drivers, and entity ORM. SQLite and MySQL use the same
`Query` and `Entity` APIs.

## Configuration

Applications configure the active driver through `DatabaseConfig` and register `DatabaseProvider`. Outside an application, assign
`Query.connection` before creating queries:

```ts
import { Connection, Query, SqliteDriver } from '@Typetron/Database'
import { DatabaseConfig } from '@Typetron/Framework'

export const config = new DatabaseConfig({
    driver: 'sqlite',
    migrationsDirectory: 'Database/migrations',
    seedersDirectory: 'Database/seeders',
})

Query.connection = new Connection(new SqliteDriver(':memory:'))
```

The built-in SQLite driver reads `process.env.database` and otherwise uses `database.sqlite`. The MySQL driver reads the database host,
user, password, and database environment values. All queries and entities use the static `Query.connection`.

## Queries and Entities

Start a query with `Query.table`, or extend `Entity` and decorate mapped properties. The following example defines an entity and exercises
both APIs:

```ts
import {
    Column,
    CreatedAt,
    Entity,
    HasMany,
    Options,
    PrimaryColumn,
    Query,
    Relation,
    UpdatedAt,
} from '@Typetron/Database'
import { Post } from '../Entities/Post'

@Options({table: 'users'})
class User extends Entity {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    email: string

    @CreatedAt()
    createdAt: Date

    @UpdatedAt()
    updatedAt: Date

    @Relation(() => Post, 'author')
    posts: HasMany<Post>
}

const id = await Query.table('users').insertOne({name: 'John'})
const user = await User.create({
    name: 'Jane',
    email: 'jane@example.com',
})

const users = await User
    .whereLike('email', '%@example.com')
    .orderBy('name', 'ASC')
    .get()

user.name = 'Janet'
await user.save()
```

The query builder supports selection, joins, grouping, ordering, limits, aggregates, subqueries, and common `where` variants. Use `first`,
`insert`, `insertOne`, `update`, and `delete` to execute work; `insertOne` resolves to the identifier supplied by the active driver.

Without `@Options`, an entity table defaults to the lowercase class name. `@Column('column_name')` maps another column name, while
`@JSONColumn` serializes objects as JSON. Use `find` or `first` when absence is expected; `findOrFail` throws `EntityNotFoundError`.
`firstOrNew` returns an unsaved entity, while `firstOrCreate` persists it.

## Relationships

Typetron supports `BelongsTo`, `HasOne`, `HasMany`, and `BelongsToMany`. Declare both sides with `@Relation`, naming the inverse property:

The `User.posts` property above pairs with a `Post.author: BelongsTo<User>` relation whose inverse name is `posts`. Load the relation with
`User.with('posts').get()`, or use `User.withCount('posts').get()` to add a `postsCount` value.

`with` accepts nested relation paths and constrained relation queries. `withCount` places the loaded count on the corresponding
`<relation>Count` property.

## Migrations and Seeders

Migration classes implement `up` and `down` with the provided connection. Seeders implement `run` against the active connection:

```ts
import { Query } from '@Typetron/Database'
import { Migration } from '@Typetron/Database/Migrations'
import { Seeder } from '@Typetron/Database/Seeders'

export class CreateUsersTable extends Migration {
    async up() {
        await this.connection.runRaw(
            'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)'
        )
    }

    async down() {
        await this.connection.runRaw('DROP TABLE users')
    }
}

export class UserSeeder extends Seeder {
    async run() {
        await Query.table('users').insert({name: 'John'})
    }
}
```

`Migrator.migrate` discovers pending TypeScript files and records batches. `rollback(steps)` and `reset` invoke migration `down` methods.
`SeederManager.seed` discovers TypeScript seeder files and runs them.

> Warning: `reset` reverses migrations against the active database. `migrate({fresh: true})` clears only the migration history; it does not
> drop existing application tables before rerunning migrations.
