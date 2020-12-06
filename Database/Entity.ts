import { EntityProxyHandler } from './EntityProxyHandler'
import { EntityQuery } from './EntityQuery'
import { ChildObject, KeysOfType } from '@Typetron/Support'
import { EntityMetadata, EntityMetadataKey, ID } from './Decorators'
import { EntityNotFoundError } from './EntityNotFoundError'
import { BelongsTo, BelongsToMany, ColumnField, HasMany, HasOne, InverseField } from './Fields'
import { Boolean as BooleanType, Direction, Operator, WhereFunction, WhereValue } from './Types'
import { DotNotationProperties, EntityConstructor, EntityKeys, EntityObject } from './index'
import { BaseRelationship } from './ORM/BaseRelationship'
import { Query } from '@Typetron/Database'

export abstract class Entity {

    exists = false
    // tslint:disable-next-line:no-any
    original: Record<string, any> = {}

    constructor(data?: object) {
        const entityProxyHandler = new EntityProxyHandler<this>()
        const proxy = new Proxy(this, entityProxyHandler)
        entityProxyHandler.entityProxy = proxy

        proxy.fill(this.original = data || {})
        return proxy
    }

    static get metadata(): EntityMetadata<Entity> {
        return Reflect.getMetadata(EntityMetadataKey, this.prototype)
    }

    get metadata(): EntityMetadata<Entity> {
        return this.static.metadata
    }

    get static(): EntityConstructor<this> {
        return this.constructor as EntityConstructor<this>
    }

    static where<T extends Entity, K extends EntityKeys<T>>(
        this: EntityConstructor<T>,
        column: EntityKeys<T>,
        operator: Operator | Query | WhereValue | T[K],
        value?: Query | WhereValue | T[K],
        boolean?: BooleanType
    ): EntityQuery<T> {
        const columnMetadata = {
            ...this.metadata.columns,
            ...this.metadata.relationships
        }[column as string]
        return this.newQuery().where(columnMetadata.column, operator, value, boolean)
    }

    static whereIn<T extends Entity, K extends EntityKeys<T>>(
        this: EntityConstructor<T>,
        column: EntityKeys<T>,
        value: Query | WhereValue[] | T[K][],
        boolean?: BooleanType
    ): EntityQuery<T> {
        return this.newQuery().whereIn(column, value, boolean)
    }

    static whereNotIn<T extends Entity, K extends EntityKeys<T>>(
        this: EntityConstructor<T>,
        column: EntityKeys<T>,
        value: Query | WhereFunction | WhereValue[] | T[K][]
    ): EntityQuery<T> {
        return this.newQuery().whereNotIn(column, value)
    }

    static whereLike<T extends Entity, K extends EntityKeys<T>>(
        this: EntityConstructor<T>,
        column: EntityKeys<T>,
        value?: WhereValue | T[K],
        boolean?: BooleanType
    ): EntityQuery<T> {
        return this.newQuery().whereLike(column, value as WhereValue, boolean)
    }

    static async first<T extends Entity, K extends EntityKeys<T>>(
        this: EntityConstructor<T>,
        ...columns: EntityKeys<T>[]
    ): Promise<T | undefined> {
        return this.newQuery().first(...columns)
    }

    // static first2: <T extends Entity>(this: EntityConstructor<T>, ...params: Parameters<Query<T>['first']>) =>  Query<T>['first'];

    // tslint:disable-next-line:no-any
    static async firstOrNew<T extends Entity, K extends keyof Entity>(
        this: EntityConstructor<T>,
        properties: Partial<EntityObject<T>>,
        values?: Partial<EntityObject<T>>
    ): Promise<T> {
        return this.newQuery().firstOrNew(properties, values)
    }

    // tslint:disable-next-line:no-any
    static async firstOrCreate<T extends Entity, K extends keyof Entity>(
        this: EntityConstructor<T>,
        properties: Partial<EntityObject<T>>,
        values?: Partial<EntityObject<T>>
    ): Promise<T> {
        return (await this.firstOrNew(properties, values)).save()
    }

    static orderBy<T extends Entity, K extends EntityKeys<T>>(
        this: EntityConstructor<T>,
        column: EntityKeys<T>,
        direction?: Direction
    ): EntityQuery<T> {
        return this.newQuery().orderBy(column, direction)
    }

    static getTable<T extends Entity>(this: EntityConstructor<T>): string {
        return this.metadata.table || this.name.toLowerCase() // TODO make metadata.table un-optional
    }

    static new<T extends Entity, K extends keyof T>(
        this: EntityConstructor<T>,
        data: Partial<ChildObject<T, Entity>> | {},
        exists = false
    ): T {
        const instance = new this(data)
        instance.exists = exists

        return instance
    }

    static create<T extends Entity>(this: EntityConstructor<T>, data: ChildObject<T, Entity> | {}): Promise<T> {
        return (new this).save(data)
    }

    static async get<T extends Entity>(this: EntityConstructor<T>, ...columns: EntityKeys<T> []): Promise<T[]> {
        return this.newQuery().get(...columns)
    }

    static with<T extends Entity>(
        this: EntityConstructor<T>,
        ...relations: (
            // tslint:disable-next-line:no-any
            KeysOfType<T, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>> | DotNotationProperties<T> |
            // tslint:disable-next-line:no-any max-line-length
            [KeysOfType<T, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>> | DotNotationProperties<T>, (Query: EntityQuery<any>) => void]
            )[]
    ) {
        return this.newQuery().with(...relations)
    }

    static withCount<T extends Entity, K extends KeysOfType<T, BaseRelationship<Entity>>>(this: EntityConstructor<T>, ...relations: K[]) {
        return this.newQuery().withCount(...relations)
    }

    static async find<T extends Entity>(this: EntityConstructor<T>, id: string | number | ID): Promise<T> {
        const query = this.newQuery().where('id' as keyof T, id as number)
        const instance = await query.first()
        if (!instance || !Object.entries(instance).length) {
            throw new EntityNotFoundError(`No records found for entity '${this.name}' when querying with parameters [${query.getBindings().join(', ')}]`)
        }
        return instance
    }

    static getPrimaryKey<T extends Entity>(): EntityKeys<T> {
        return 'id' as EntityKeys<T>
    }

    static hydrate<T extends Entity>(modelType: EntityConstructor<T>, models: Partial<ChildObject<T, Entity>>[], exist = false) {
        return models.map(data => {
            return modelType.new(data, exist)
        })
    }

    static newQuery<T extends Entity>(this: EntityConstructor<T>): EntityQuery<T> {
        return (new EntityQuery(this)).table(this.getTable())
    }

    getTable(): string {
        return this.static.getTable()
    }

    async load(
        // tslint:disable-next-line:no-any
        ...relations: (KeysOfType<this, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>> | DotNotationProperties<this>)[]
    ) {
        await this.newQuery().with(...relations).eagerLoadRelationships([this])

        return this
    }

    async loadCount<K extends KeysOfType<this, BaseRelationship<Entity>>>(...relations: K[]) {
        await this.newQuery().withCount<K>(...relations).eagerLoadRelationshipsCounts([this])

        return this
    }

    newQuery() {
        return this.static.newQuery()
    }

    async save(data: ChildObject<this, Entity> | {} = {}): Promise<this> {
        this.fill(data)

        this.updateTimestamps()

        // tslint:disable-next-line:no-any
        const dataToSave: Record<string, any> = {}

        // TODO diff the values so we don't update every value from the entity
        Object.values({...this.metadata.columns, ...this.metadata.relationships}).forEach(field => {
            dataToSave[field.column] = field.value(this, field.property)
        })

        const query = this.newQuery()

        if (this.exists) {
            delete dataToSave[this.getPrimaryKey() as string]
            await query.where(this.getPrimaryKey(), this[this.getPrimaryKey()]).update(dataToSave)
        } else {
            await query.insert(dataToSave)
            const id = await EntityQuery.lastInsertedId()
            this.exists = true
            this.fill({id})
        }

        return this
    }

    fill(data: ChildObject<this, Entity> | {}) {
        const relationships = this.metadata.allRelationships

        Object.keys(relationships).forEach(key => {
            if (!this[key as keyof this]) {
                // @ts-ignore
                this[key] = new relationships[key].relationClass(relationships[key], this) as unknown as T[keyof T]
            }
        })

        const fields = {...this.metadata.columns, ...this.metadata.relationships, ...this.metadata.inverseRelationships}
        Object.keys(data).forEach(key => {
            const field = fields[key]
            if (field) {
                const value = data[key as keyof {}]
                field.set(this, this.convertValueByType(value, field))
            }
        })

        return this
    }

    async delete() {
        if (!this.exists) {
            return
        }

        await this.newQuery().where(this.getPrimaryKey(), this[this.getPrimaryKey()]).delete()
    }

    getPrimaryKey<T extends Entity>(this: T): EntityKeys<T> {
        return this.static.getPrimaryKey()
    }

    toJSON() {
        return Object.keys({...this.metadata.columns, ...this.metadata.allRelationships})
            .reduce((obj, key) => {
                if (this.hasOwnProperty(key)) {
                    obj[key as keyof this] = this[key as keyof this]
                }
                return obj
            }, <{ [K in keyof this]: this[K] }>{})
    }

    private updateTimestamps() {
        if (this.metadata.createdAtColumn && !this[this.metadata.createdAtColumn as keyof this]) {
            this.fill({
                [this.metadata.createdAtColumn]: new Date(),
            })
        }
        if (this.metadata.updatedAtColumn) {
            this.fill({
                [this.metadata.updatedAtColumn]: new Date(),
            })
        }
    }

    private convertValueByType(value: unknown, property: ColumnField<Entity> | InverseField<Entity>) {
        const converter = types.get(property.type()) || (() => value)
        return converter(value)
    }
}

const types: Map<Function, Function> = new Map()
types.set(Date, (value: number) => value ? new Date(value) : value)
types.set(String, (value: object) => value ? String(value) : value)
types.set(Boolean, (value: string) => Boolean(value))

// let handler = {
// 	set: (target, prop, value) => {
// 		console.log(target, prop, value);
// 		target[prop] = value;
// 		return true;
// 	},
// 	get: (target, prop) => {
// 		if(!(prop in Entity))
// 			return () => {return new Query};
// 		return target[prop];
// 	}
// };

// Object.setPrototypeOf(Entity, new Proxy({}, new EntityProxyHandler(Entity)));
