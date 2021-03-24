import { SqlValue } from '@Typetron/Database/Types'
import { Statement } from './Statement'
import { Constructor } from '@Typetron/Support'
import { SchemaContract } from '@Typetron/Database/Drivers/SchemaContract'

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

    abstract tableExists(table: string): Promise<Boolean>

    abstract tableColumns(table: string): Promise<{name: string, type: string}[]>
}
