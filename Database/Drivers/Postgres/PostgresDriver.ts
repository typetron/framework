import { Pool, PoolClient, PoolConfig, types } from 'pg'
import { SqlValue } from '../../Types'
import { Insert } from '../SQL/Statements/Insert'
import { Alter } from '../SQL/Statements/Alter'
import { SchemaContract } from '../SchemaContract'
import { DatabaseDriver } from '../DatabaseDriver'
import { wrap } from '../../Helpers'
import { Create } from '../SQL/Create'
import { Schema } from './Schema'
import { Delete, Select, Update } from './Statements'
import { toPostgresSQL } from './Helpers'

interface ColumnInfo {
    name: string
    type: string
    nullable: boolean
    default?: string
    autoIncrement: boolean
    primaryKey: boolean
}

/**
 * Results read like the other drivers: counts and other bigints as numbers,
 * JSON as text that JSONField parses, so a JSON string value is not parsed twice.
 */
const resultParsers = new Map<number, (value: string) => unknown>([
    [types.builtins.INT8, Number],
    [types.builtins.JSON, value => value],
    [types.builtins.JSONB, value => value],
])

/** Postgres spells some types differently than they are declared */
const typeAliases: [RegExp, string][] = [
    [/^character varying/, 'varchar'],
    [/^timestamp without time zone$/, 'timestamp'],
]

export class PostgresDriver extends DatabaseDriver {
    pool: Pool

    schema: SchemaContract = new Schema(this)

    statements = {
        create: Create,
        select: Select,
        insert: Insert,
        delete: Delete,
        update: Update,
        alter: Alter,
    }

    constructor(poolConfig: PoolConfig) {
        super()
        this.pool = new Pool({
            connectionTimeoutMillis: 30000,
            types: {
                getTypeParser: (id, format) => resultParsers.get(id) ?? types.getTypeParser(id, format),
            },
            ...poolConfig,
        })
    }

    async truncate(table: string) {
        await this.run(`TRUNCATE TABLE ${wrap(table)} RESTART IDENTITY`)
    }

    async runRaw<T>(query: string, params: SqlValue[] = [], client: Pool | PoolClient = this.pool): Promise<T[]> {
        const sql = toPostgresSQL(query)
        try {
            return (await client.query(sql, params)).rows
        } catch (error) {
            (error as Error).message += ` in SQL: "${sql}"`
            throw error
        }
    }

    async run(query: string, params: SqlValue[] = []) {
        await this.runRaw(query, params)
    }

    async get<T>(query: string, params: SqlValue[] = []): Promise<T[]> {
        return this.runRaw<T>(query, params)
    }

    async first<T>(query: string, params: SqlValue[] = []): Promise<T> {
        return (await this.runRaw<T>(query, params))[0]
    }

    /** Reads the id from the session's last used sequence, so the inserted table needs an identity column */
    async insertOne(query: string, params: SqlValue[] = []): Promise<number> {
        const client = await this.pool.connect()
        try {
            await this.runRaw(query, params, client)
            return (await this.runRaw<{id: number}>('SELECT lastval() AS id', [], client))[0].id
        } finally {
            client.release()
        }
    }

    async tableColumns(table: string) {
        const columnsInfo = await this.get<ColumnInfo>(
            `select c.column_name                                                       as name,
                    format_type(a.atttypid, a.atttypmod)                                as type,
                    c.is_nullable = 'YES'                                               as nullable,
                    c.column_default                                                    as "default",
                    c.is_identity = 'YES' or coalesce(c.column_default, '') like 'nextval(%' as "autoIncrement",
                    exists(select 1
                           from information_schema.table_constraints tc
                                    join information_schema.key_column_usage k
                                         on k.constraint_name = tc.constraint_name
                                             and k.table_schema = tc.table_schema
                           where tc.constraint_type = 'PRIMARY KEY'
                             and tc.table_schema = c.table_schema
                             and tc.table_name = c.table_name
                             and k.column_name = c.column_name)                         as "primaryKey"
             from information_schema.columns c
                      join pg_attribute a
                           on a.attrelid = (quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass
                               and a.attname = c.column_name
             where c.table_name = ?
               and c.table_schema = current_schema()
             order by c.ordinal_position
            `,
            [table]
        )

        return columnsInfo.map(info => ({
            name: info.name,
            type: typeAliases.reduce((type, [pattern, alias]) => type.replace(pattern, alias), info.type),
            nullable: info.nullable,
            default: info.default,
            autoIncrement: Number(info.autoIncrement),
            primaryKey: info.primaryKey,
        }))
    }
}
