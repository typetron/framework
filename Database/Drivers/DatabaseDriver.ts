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

    abstract get<T>(query: string, params: SqlValue[]): Promise<T | T[]>

    abstract first<T>(query: string, params: SqlValue[]): Promise<T | undefined>

    abstract tables(): Promise<{name: string}[]>

    abstract tableExists(table: string): Promise<boolean>

    abstract tableColumns(table: string): Promise<ColumnDefinitionOptions[]>
}
