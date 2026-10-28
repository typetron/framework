import { SqlValue } from '../Types'
import { Statement } from './Statement'
import { Constructor } from '@Typetron/Support'
import { SchemaContract } from './SchemaContract'
import { ColumnDefinitionOptions } from '@Typetron/Database/Drivers/SQL'

interface StatementsList {
    create: Constructor<Statement>,
    select: Constructor<Statement>,
    insert: Constructor<Statement>,
    delete: Constructor<Statement>,
    update: Constructor<Statement>,
    alter: Constructor<Statement>,
}

export abstract class DatabaseDriver {

    abstract statements: StatementsList

    abstract schema: SchemaContract

    abstract run(query: string, params?: SqlValue[]): Promise<void>

    abstract truncate(table: string): Promise<void>

    abstract insertOne(query: string, params: SqlValue[]): Promise<number>

    abstract get<T>(query: string, params?: SqlValue[]): Promise<T[]>

    abstract first<T>(query: string, params: SqlValue[]): Promise<T | undefined>

    tables(): Promise<{name: string}[]> {
        const [schemaCondition, params] = this.currentSchema()
        return this.get<{name: string}>(
            `select table_name as name
             from information_schema.tables
             where table_schema = ${schemaCondition}
            `,
            params
        )
    }

    async tableExists(table: string): Promise<boolean> {
        const [schemaCondition, params] = this.currentSchema()
        return Boolean(await this.first(
            `select *
             from information_schema.tables
             where table_name = ?
               and table_schema = ${schemaCondition}
            `,
            [table, ...params]
        ))
    }

    /**
     * SQL condition matching `table_schema` to the connection's schema, with its bindings.
     * Defaults to the SQL standard `current_schema()`.
     */
    protected currentSchema(): [string, SqlValue[]] {
        return ['current_schema()', []]
    }

    abstract tableColumns(table: string): Promise<ColumnDefinitionOptions[]>
}
