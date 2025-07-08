import { Entity } from './Entity'
import { EntityConstructor, EntityKeys, EntityMetadata, EntityObject, ID, Query, StringExpression } from './index'
import { List } from './List'
import { BaseRelationship } from './ORM/BaseRelationship'
import { wrap } from './Helpers'
import { EntityQuery } from './EntityQuery'

export interface EntityField<T extends Entity> {

    value<K extends keyof T>(entity: T, key: string): T[K] | T[K][] | string | number | undefined;

    set<K extends keyof T>(entity: T, key: T[K]): void;
}

export class ColumnField<T extends Entity> implements EntityField<T> {
    constructor(
        public entity: EntityConstructor<T>,
        public property: string,
        public type: () => Function,
        public column: string
    ) {}

    value<K extends keyof T>(entity: T, key: string): T[K] | T[K][] | string | number | undefined {
        return entity[key as K]
    }

    set(target: T, value: T[keyof T]) {
        target[this.property as keyof T] = value
    }
}

export class JSONField<T extends Entity> extends ColumnField<T> {

    value<K extends keyof T>(entity: T, key: string): T[K] | T[K][] | string | number | undefined {
        return JSON.stringify(entity[key as K])
    }

    set(target: T, value: T[keyof T]) {
        target[this.property as keyof T] = typeof value === 'string' ? JSON.parse(value) : undefined
    }
}

export abstract class InverseField<T extends Entity> implements EntityField<T> {
    protected constructor(
        public entity: EntityConstructor<T>,
        public property: string,
        public type: () => Function
    ) {}

    value<K extends keyof T>(entity: T, key: string): T[K] | T[K][] | string | number | undefined {
        return entity[key as K]
    }

    abstract set(target: T, value: T[keyof T]): void

    // relationshipColumnValue<K extends keyof T>(entity: T, value: T[K]): T[K] | T[K][] | string | number | undefined {
    //     return value;
    // }
}

export class PrimaryField<T extends Entity> extends ColumnField<T> {
}

export abstract class RelationshipField<T extends Entity, R extends Entity> extends ColumnField<T> {
    abstract relationClass: typeof BaseRelationship

    protected constructor(
        entity: EntityConstructor<T>,
        property: string,
        public type: () => EntityConstructor<R>,
        public inverseBy: string,
        column: string
    ) {
        super(entity, property, type, column)
    }

    get related() {
        return this.type()
    }

    abstract match(entities: T[], relatedEntities: R[]): T[]

    abstract matchCounts(entities: T[], counts: T[]): T[]

    abstract getRelatedValue(
        relatedEntities: R[],
        eagerLoad: EntityQuery<T>['eagerLoad'],
        customQuery?: (query: Query) => void
    ): Promise<R[]>

    abstract getRelatedCount(relatedEntities: R[], customQuery?: (query: Query) => void): Promise<T[]>

    abstract update(target: T): void
}

export abstract class InverseRelationship<T extends Entity, R extends Entity> extends InverseField<T> {
    abstract relationClass: typeof BaseRelationship

    protected constructor(
        entity: EntityConstructor<T>,
        property: string,
        public type: () => EntityConstructor<R>,
        public inverseBy: string
    ) {
        super(entity, property, type)
    }

    get related() {
        return this.type()
    }

    abstract match(entities: T[], relatedEntities: R[]): T[]

    abstract matchCounts(entities: T[], counts: T[]): T[]

    abstract getRelatedValue(
        relatedEntities: R[],
        eagerLoad: EntityQuery<T>['eagerLoad'],
        customQuery?: (query: Query) => void
    ): Promise<R[]>

    abstract getRelatedCount(relatedEntities: R[], customQuery?: (query: Query) => void): Promise<T[]>

}

export class HasOneField<T extends Entity, R extends Entity> extends InverseRelationship<T, R> {
    relationClass = HasOne

    constructor(
        entity: EntityConstructor<T>,
        property: string,
        type: () => EntityConstructor<R>,
        inverseBy: string // TODO make it key of R
    ) {
        super(entity, property, type, inverseBy)
    }

    set(target: T, value: T[keyof T]) {
        (target[this.property as keyof T] as InstanceType<this['relationClass']>).set(value as unknown as R)
    }

    async getRelatedValue(relatedEntities: R[], eagerLoad: EntityQuery<T>['eagerLoad'], customQuery?: (query: Query) => void) {
        const parentIds = relatedEntities.pluck(this.entity.getPrimaryKey()) as number[]
        const inverseByField = this.related.metadata.relationships[this.inverseBy]
        const query = this.related.with(...eagerLoad).whereIn(inverseByField.column as EntityKeys<R>, parentIds)

        customQuery?.(query)

        return await query.get()
    }

    async getRelatedCount(relatedEntities: R[], customQuery?: (query: Query) => void) {
        const relatedField = this.related.metadata.relationships[this.inverseBy]

        const query = this.related.newQuery()
            .whereIn(relatedField.column, relatedEntities.pluck(this.entity.getPrimaryKey()))
            .select(relatedField.column)
            .groupBy(relatedField.column)

        customQuery?.(query)

        return await query
            .selectCount()
            .get() as unknown as T[]
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        entities.forEach(entity => {
            const inverseField = this.related.metadata.relationships[this.inverseBy]
            const relatedEntity = relatedEntities.find(
                related => related.original[inverseField.column as keyof object] === entity[this.entity.getPrimaryKey()]
            );
            // TODO fix these weird types. Get rid of `unknown`
            (entity[this.property as keyof T] as unknown as BelongsTo<R>).set(relatedEntity as R)
        })
        return entities
    }

    matchCounts(entities: T[], counts: T[]): T[] {
        const relatedField = this.related.metadata.relationships[this.inverseBy]
        entities.forEach(entity => {
            const count = counts.find(item => item.original[relatedField.column] === entity[this.entity.getPrimaryKey()])
            entity[this.property + 'Count' as keyof T] = (count?.original.aggregate ?? 0) as unknown as T[keyof T]
        })

        return entities
    }
}

export class HasManyField<T extends Entity, R extends Entity> extends InverseRelationship<T, R> {
    relationClass = HasMany

    constructor(entity: EntityConstructor<T>, property: string, type: () => EntityConstructor<R>, public inverseBy: string) {
        super(entity, property, type, inverseBy)
    }

    set(target: T, value: T[keyof T]) {

    }

    async getRelatedValue(relatedEntities: R[], eagerLoad: EntityQuery<T>['eagerLoad'], customQuery?: (query: Query) => void) {
        const parentIds = relatedEntities.pluck(this.entity.getPrimaryKey()) as number[]
        const inverseByField = this.related.metadata.relationships[this.inverseBy]
        const query = this.related.with(...eagerLoad).whereIn(inverseByField.column as EntityKeys<R>, parentIds)

        customQuery?.(query)

        return await query.get()
    }

    async getRelatedCount(relatedEntities: R[], customQuery?: (query: Query) => void) {
        const relatedField = this.related.metadata.relationships[this.inverseBy]

        const query = this.related.newQuery()
            .whereIn(relatedField.column, relatedEntities.pluck(this.entity.getPrimaryKey()))
            .select(relatedField.column)
            .groupBy(relatedField.column)

        customQuery?.(query)

        return await query
            .selectCount()
            .get() as unknown as T[]
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        entities.forEach(entity => {
            const inverseField = this.related.metadata.relationships[this.inverseBy]
            const relatedEntity = relatedEntities.filter(
                related => related.original[inverseField.column as keyof object] === entity[this.entity.getPrimaryKey()]
            );
            // TODO fix these weird types. Get rid of `unknown`
            (entity[this.property as keyof T] as unknown as HasMany<R, T>).items = relatedEntity
        })
        return entities
    }

    matchCounts(entities: T[], counts: T[]): T[] {
        const relatedField = this.related.metadata.relationships[this.inverseBy]
        entities.forEach(entity => {
            const count = counts.find(item => item.original[relatedField.column] === entity[this.entity.getPrimaryKey()])
            entity[this.property + 'Count' as keyof T] = (count?.original.aggregate ?? 0) as unknown as T[keyof T]
        })

        return entities
    }

    async save(items: Partial<EntityObject<R> | R>[], parent: T) {
        const entities: R[] = []
        for await (const item of items) {
            const entity = item instanceof Entity ? item : this.type().new(item)

            entity.fill({
                [this.inverseBy]: parent
            })
            await entity.save()
            entities.push(entity as R)
        }
        return entities
    }

    getQuery(parent: T) {
        const inverseField = this.related.metadata.relationships[this.inverseBy]
        return this.type().newQuery().where(inverseField.column, parent[parent.getPrimaryKey()] as unknown as R[keyof R])
    }
}

export class BelongsToField<T extends Entity, R extends Entity> extends RelationshipField<T, R> {
    relationClass = BelongsTo

    constructor(
        entity: EntityConstructor<T>,
        property: string,
        type: () => EntityConstructor<R>,
        inverseBy: string,
        column?: string
    ) {
        super(entity, property, type, inverseBy, column || property + (entity.getPrimaryKey() as string).capitalize())
    }

    set(target: T, value: T[keyof T]) {
        (target[this.property as keyof T] as InstanceType<this['relationClass']>).set(value as unknown as R)
    }

    update(target: T) {
        (target[this.property as keyof T] as InstanceType<this['relationClass']>).update()
    }

    value<K extends keyof T>(entity: T, key: string) {
        const field = entity[key as keyof T] as unknown as BelongsTo<R, T>
        const instance = field.get()
        if (instance) {
            return instance[this.related.getPrimaryKey()]
        }
        // return new this.related({
        //     [this.related.getPrimaryKey()]: entity[key as K]
        // }) as unknown as T[K]; // TODO get rid of `unknown`
        // if (key === this.column) {
        //     return new this.related({
        //         [this.related.getPrimaryKey()]: entity[key as K]
        //     }) as unknown as T[K]; // TODO get rid of `unknown`
        // }
        // return entity[this.property as keyof T] as unknown as T[K];
    }

    async getRelatedValue(parents: R[], eagerLoad: EntityQuery<T>['eagerLoad'], customQuery?: (query: Query) => void) {
        const relationIds = parents
            .map(parent => {
                const relation = (parent[this.property as keyof R] as unknown as BelongsTo<R>).get()
                return relation?.[relation.getPrimaryKey()]
            })
            .filter(Boolean) as unknown as number[]
        if (relationIds.length) {
            const query = this.related.with(...eagerLoad).whereIn(this.related.getPrimaryKey() as EntityKeys<R>, relationIds)

            if (customQuery) {
                customQuery(query)
            }

            return await query.get()
        }
        return []
    }

    async getRelatedCount(relatedEntities: R[], customQuery?: (query: Query) => void) {
        return []
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        return entities.map(entity => {
            // TODO fix these weird types. Get rid of `unknown`
            const related = (entity[this.property as keyof T] as unknown as BelongsTo<R>).get()
            const value = related?.[related.getPrimaryKey()]
            if (value) {
                const instance = relatedEntities.findWhere(this.related.getPrimaryKey() as keyof R, value)
                if (instance) {
                    this.set(entity, instance as unknown as T[keyof T])
                }
            }
            return entity
        })
    }

    matchCounts(entities: T[], counts: T[]): T[] {
        return entities
    }

    getQuery(parent: T) {
        return this.entity.newQuery().where(this.column, parent[parent.getPrimaryKey()] as unknown as T[keyof T])
    }

    async save(items: Partial<EntityObject<R> | R>[], parent: T) {
        const entities: R[] = []
        for await (const item of items) {
            const entity = item instanceof Entity ? item : this.related.new(item)

            entity.fill({
                [this.property]: parent
            })
            await entity.save()
            entities.push(entity as R)
        }
        return entities
    }
}

export class BelongsToManyField<T extends Entity, R extends Entity> extends InverseRelationship<T, R> {
    relationClass = BelongsToMany

    constructor(
        entity: EntityConstructor<T>,
        property: string,
        type: () => EntityConstructor<R>,
        inverseBy: string,
        public table?: string,
        public parentColumn?: string,
        public relatedColumn?: string
    ) {
        super(entity, property, type, inverseBy)
    }

    set(target: T, value: T[keyof T]) {
    }

    async getRelatedValue(parents: R[], eagerLoad: EntityQuery<T>['eagerLoad'], customQuery?: (query: Query) => void) {
        const parentIds = parents.pluck(this.entity.getPrimaryKey()) as number[]
        const relatedForeignKey = `${wrap(this.getPivotTable())}.${this.getRelatedForeignKey()}`
        const parentForeignKey = `${wrap(this.getPivotTable())}.${this.getParentForeignKey()}`
        const relatedKey = `${wrap(this.related.getTable())}.${this.related.getPrimaryKey()}`

        const query = this.related
            .with(...eagerLoad)
            .addSelect(
                new StringExpression(`${wrap(this.related.getTable())}.*`),
                new StringExpression(relatedForeignKey),
                new StringExpression(parentForeignKey)
            )
            .join(this.getPivotTable(), relatedForeignKey, '=', relatedKey)
            .whereIn(parentForeignKey, parentIds.unique())

        customQuery?.(query)

        const results = await query.get()

        return results.map(entity => {
            entity.original.pivot = {
                [this.getParentForeignKey()]: entity.original[this.getParentForeignKey()],
                [this.getRelatedForeignKey()]: entity.original[this.getRelatedForeignKey()],
            }
            delete entity.original[this.getParentForeignKey()]
            delete entity.original[this.getRelatedForeignKey()]

            return entity
        })
    }

    getParentForeignKey() {
        return this.parentColumn || `${this.entity.name.toLowerCase()}${(this.entity.getPrimaryKey() as string).capitalize()}`
    }

    getRelatedForeignKey() {
        return this.relatedColumn || `${this.related.name.toLowerCase()}${(this.related.getPrimaryKey() as string).capitalize()}`
    }

    async getRelatedCount(relatedEntities: R[], customQuery?: (query: Query) => void) {
        const query = Query.table(this.getPivotTable())
            .select(this.getParentForeignKey())
            .groupBy(this.getParentForeignKey())
            .whereIn(this.getParentForeignKey(), relatedEntities.pluck(this.related.getPrimaryKey()) as unknown as number[])

        customQuery?.(query)

        return await query.selectCount().get() as unknown as T[]

    }

    match(entities: T[], relatedEntities: R[]): T[] {
        return entities.map(entity => {
            const entityPrimaryKey = entity[this.entity.getPrimaryKey()];
            (entity[this.property as keyof T] as unknown as BelongsToMany<R>).items = relatedEntities
                .filter(related => related.original.pivot[this.getParentForeignKey()] === entityPrimaryKey)
            return entity
        })
    }

    matchCounts(entities: T[], counts: T[]): T[] {
        entities.forEach(entity => {
            const foreignKey = this.getParentForeignKey()
            const count = counts.find(item =>
                (item?.original?.[foreignKey] || item[foreignKey as keyof T]) === entity[this.entity.getPrimaryKey()]
            )
            // @ts-ignore
            const aggregateValue = count?.aggregate || count?.original.aggregate
            entity[this.property + 'Count' as keyof T] = (aggregateValue ?? 0) as unknown as T[keyof T]
        })

        return entities
    }

    getPivotTable() {
        return this.table || [this.entity.getTable(), this.related.getTable()].sort().join('_')
    }

    value<K extends keyof T>(entity: T, key: string): T[K] {
        const value = entity[key as K]
        if (value instanceof Array) {
            return value.map(related => {
                if (related instanceof Entity) {
                    return related
                }
                const instance = this.related.new({[this.related.getPrimaryKey()]: related})
                return instance
            }) as unknown as T[K]
        }
        return value
    }

    async add(items: (R | ID)[], parent: T) {
        const entities: R[] = []
        // tslint:disable-next-line:no-any
        const dataToInsert: Record<string, any>[] = []
        for await (const item of items) {
            dataToInsert.push({
                [this.getRelatedForeignKey()]: item instanceof Entity ? item.getPrimaryKeyValue() : item,
                [this.getParentForeignKey()]: parent.getPrimaryKeyValue(),
            })
            entities.push(this.related.new({[this.related.getPrimaryKey()]: item}))
        }
        if (dataToInsert.length) {
            await Query.table(this.getPivotTable()).insert(dataToInsert)
        }
        return entities

    }

    getQuery(parent: T) {
        return this.related.newQuery().whereIn(this.related.getPrimaryKey(), query => {
            query.select(this.getRelatedForeignKey())
                .table(this.getPivotTable())
                .where(this.getParentForeignKey(), parent[parent.getPrimaryKey()] as unknown as string)
        })
    }
}

export interface EntityFieldOptions {
    table?: string;
    column?: string;
}

export interface BelongsToManyFieldOptions extends EntityFieldOptions {
    foreignColumn?: string;
}

export class BelongsTo<T extends Entity, P extends Entity = Entity> extends BaseRelationship<T, P> {

    private instance?: T

    constructor(
        relationship: RelationshipField<P, T>,
        parent: P
    ) {
        super(relationship, parent)
        this.update()
    }

    update() {
        const parentId = this.parent.original[(this.relationship as RelationshipField<P, T>).column]
        if (parentId && !this.instance) {
            this.setById(parentId)
        }
    }

    static relationship<T extends Entity, R extends Entity>(
        metadata: EntityMetadata<T, R>,
        entityClass: EntityConstructor<T>,
        property: keyof T,
        type: () => EntityConstructor<R>,
        inverseBy: keyof R,
        options?: EntityFieldOptions
    ) {

        metadata.relationships[property as string] = new BelongsToField(
            entityClass,
            property as string,
            type,
            inverseBy as string,
            options?.column,
        )

        return metadata
    }

    get() {
        return this.instance
    }

    set(instance: T | number) {
        if (instance instanceof Entity) {
            this.instance = instance
        } else {
            this.setById(instance)
        }
    }

    setById(id: number) {
        this.set(this.relationship.related.new({[this.relationship.related.getPrimaryKey()]: id}))
    }

    async save(data: EntityObject<T> | {} | undefined = {}): Promise<T | undefined> {
        if (!this.instance) {
            return
        }
        this.instance.fill({
            ...data,
            // [this.relationship.column]: this.parent
        })

        await this.instance.save()
        return this.instance
    }

    toJSON() {
        return this.instance?.toJSON()
    }

}

export class HasOne<T extends Entity, P extends Entity = Entity> extends BaseRelationship<T, P> {

    public relationship: RelationshipField<P, T>
    private instance?: T

    static relationship<T extends Entity, R extends Entity>(
        metadata: EntityMetadata<T, R>,
        entityClass: EntityConstructor<T>,
        property: keyof T,
        type: () => EntityConstructor<R>,
        inverseBy: keyof R,
        options?: EntityFieldOptions
    ) {
        metadata.inverseRelationships[property as string] = new HasOneField(
            entityClass,
            property as string,
            type,
            inverseBy as string,
        )
        return metadata
    }

    get() {
        return this.instance
    }

    set(instance: T | number | undefined) {
        if (!instance) {
            return
        }
        if (instance instanceof Entity) {
            this.instance = instance
        } else {
            this.setById(instance)
        }
    }

    setById(id: number) {
        this.set(this.relationship.related.new({[this.relationship.related.getPrimaryKey()]: id}))
    }

    async save(instance: T | undefined = this.instance): Promise<T | undefined> {
        this.set(instance)

        if (instance) {
            (instance[this.relationship.inverseBy as keyof T] as unknown as BelongsTo<P, T>).set(this.parent)
            await instance.save()
        }

        return this.instance
    }

    toJSON() {
        return this.instance?.toJSON()
    }
}

export class HasMany<T extends Entity, P extends Entity = Entity> extends List<T, P> {

    constructor(
        public relationship: HasManyField<P, T>,
        parent: P
    ) {
        super(relationship, parent)
    }

    static relationship<T extends Entity, R extends Entity>(
        metadata: EntityMetadata<T, R>,
        entityClass: EntityConstructor<T>,
        property: keyof T,
        type: () => EntityConstructor<R>,
        inverseBy: keyof R,
        options?: EntityFieldOptions
    ) {
        metadata.inverseRelationships[property as string] = new HasManyField<T, R>(
            entityClass,
            property as string,
            type,
            inverseBy as string,
        )

        return metadata
    }

    async save(item: Partial<EntityObject<T> | T>): Promise<T> {
        const instances = await this.saveMany(item)
        return instances.first() as T
    }

    async saveMany(...items: Partial<EntityObject<T> | T>[]): Promise<T[]> {
        if (!this.parent.exists) {
            await this.parent.save()
        }
        const instances = await this.relationship.save(items, this.parent)

        this.items.push(...instances)

        return instances
    }

    async clear() {

    }

}

export class BelongsToMany<T extends Entity, P extends Entity = Entity> extends List<T, P> {

    constructor(
        public relationship: BelongsToManyField<P, T>,
        parent: P
    ) {
        super(relationship, parent)
    }

    static relationship<T extends Entity, R extends Entity>(
        metadata: EntityMetadata<T, R>,
        entityClass: EntityConstructor<T>,
        property: keyof T,
        type: () => EntityConstructor<R>,
        inverseBy: keyof R,
        options?: BelongsToManyFieldOptions
    ) {
        // options.column = options.column || (property as string) + (entityClass.getPrimaryKey() as string).capitalize();

        const inverseField = metadata.inverseRelationships[inverseBy as string] as BelongsToManyField<T, R> | undefined

        metadata.inverseRelationships[property as string] = new BelongsToManyField(
            entityClass,
            property as string,
            type,
            inverseBy as string,
            options?.table || inverseField?.table,
            options?.foreignColumn || inverseField?.parentColumn,
            options?.column || inverseField?.relatedColumn,
        )
        return metadata
    }

    async has(item: T | ID) {
        if (item instanceof Entity) {
            item = item.getPrimaryKeyValue()
        }
        const relatedForeignKey = `${this.relationship.getPivotTable()}.${this.relationship.getRelatedForeignKey()}`
        const parentForeignKey = `${this.relationship.getPivotTable()}.${this.relationship.getParentForeignKey()}`

        return Boolean(
            await Query.table(this.relationship.getPivotTable())
                .where(parentForeignKey, this.parent[this.parent.getPrimaryKey()] as unknown as string)
                .andWhere(relatedForeignKey, item)
                .first()
        )
    }

    async add(...items: (T | ID)[]) {
        const ids = items.map(item => item instanceof Entity ? item.getPrimaryKeyValue() : item)
        if (!this.parent.exists) {
            await this.parent.save()
        }
        for await (const id of ids) {
            if (!(await this.has(id))) {
                this.items = this.items.concat(await this.relationship.add(items, this.parent))
            }
        }

        return this.items
    }

    async remove(...items: (T | ID)[]) {
        const ids = items.map(item => item instanceof Entity ? item.getPrimaryKeyValue() : item)

        const relatedForeignKey = `${this.relationship.getPivotTable()}.${this.relationship.getRelatedForeignKey()}`
        const parentForeignKey = `${this.relationship.getPivotTable()}.${this.relationship.getParentForeignKey()}`

        await Query.table(this.relationship.getPivotTable())
            .where(parentForeignKey, this.parent[this.parent.getPrimaryKey()] as unknown as string)
            .whereIn(relatedForeignKey, ids)
            .delete()

        this.items = this.items.filter(item => !ids.includes(item.getPrimaryKeyValue()))
    }

    async toggle(...items: (T | ID)[]) {
        const ids = items.map(item => item instanceof Entity ? item.getPrimaryKeyValue() : item)

        const attachedEntities = await this.relationship.getQuery(this.parent).get()
        const entitiesToDetach = ids.filter(item =>
            attachedEntities.some(entity => entity.getPrimaryKeyValue() === item)
        )
        const entitiesToAttach = ids.filter(item =>
            attachedEntities.some(entity => entity.getPrimaryKeyValue() as unknown as number !== item)
        )
        await this.add(...entitiesToAttach)
        await this.remove(...entitiesToDetach)
    }

    async clear() {
        const relatedForeignKey = `${this.relationship.getPivotTable()}.${this.relationship.getRelatedForeignKey()}`
        const parentForeignKey = `${this.relationship.getPivotTable()}.${this.relationship.getParentForeignKey()}`

        await Query.table(this.relationship.getPivotTable())
            .where(parentForeignKey, this.parent[this.parent.getPrimaryKey()] as unknown as string)
            .whereIn(relatedForeignKey, this.items.pluck(this.relationship.related.getPrimaryKey()))
            .delete()

        this.items = []
    }

    async sync(...items: (T | ID)[]) {
        const ids = items.map(item => item instanceof Entity ? item.getPrimaryKeyValue() : item)

        const existingItems = await this.get()
        const primaryKey = this.relationship.type().getPrimaryKey()
        const itemsToRemove = existingItems.filter(item => !ids.includes(item[primaryKey])).pluck(primaryKey)
        const restOfItemsToAdd = ids.filter(item => !existingItems.findWhere(primaryKey, item as unknown as T[keyof T]))
        await this.remove(...itemsToRemove)
        await this.add(...restOfItemsToAdd)
    }

    async syncWithoutDetaching(...items: (T | ID)[]) {
        const ids = items.map(item => item instanceof Entity ? item.getPrimaryKeyValue() : item)

        const existingItems = await this.get()
        const primaryKey = this.relationship.type().getPrimaryKey()
        const restOfItemsToAdd = ids.filter(item => !existingItems.findWhere(primaryKey, item as unknown as T[keyof T]))
        await this.add(...restOfItemsToAdd)
    }

}
