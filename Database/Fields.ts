import { Entity } from './Entity';
import { EntityConstructor, EntityKeys, EntityMetadata, EntityObject, Expression, Query } from './index';
import { List } from './List';
import { BaseRelationship } from './ORM/BaseRelationship';

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
        return entity[key as K];
    }

    set(target: T, value: T[keyof T]) {
        target[this.property as keyof T] = value;
    }
}

export abstract class InverseField<T extends Entity> implements EntityField<T> {
    protected constructor(
        public entity: EntityConstructor<T>,
        public property: string,
        public type: () => Function
    ) {}

    value<K extends keyof T>(entity: T, key: string): T[K] | T[K][] | string | number | undefined {
        return entity[key as K];
    }

    abstract set(target: T, value: T[keyof T]): void;

    // relationshipColumnValue<K extends keyof T>(entity: T, value: T[K]): T[K] | T[K][] | string | number | undefined {
    //     return value;
    // }
}

export class PrimaryField<T extends Entity> extends ColumnField<T> {
}

export abstract class RelationshipField<T extends Entity, R extends Entity> extends ColumnField<T> {
    abstract relationClass: typeof BaseRelationship;

    protected constructor(
        entity: EntityConstructor<T>,
        property: string,
        public type: () => EntityConstructor<R>,
        public inverseBy: string,
        column: string
    ) {
        super(entity, property, type, column);
    }

    get related() {
        return this.type();
    }

    abstract match(entities: T[], relatedEntities: R[]): T[];

    abstract matchCounts(entities: T[], counts: Record<string, number>[]): T[];

    abstract async getRelatedValue(relatedEntities: R[]): Promise<R[]>;

    abstract async getRelatedCount(relatedEntities: R[]): Promise<Record<string, number>[]>;
}

export abstract class InverseRelationship<T extends Entity, R extends Entity> extends InverseField<T> {
    abstract relationClass: typeof BaseRelationship;

    protected constructor(
        entity: EntityConstructor<T>,
        property: string,
        public type: () => EntityConstructor<R>,
        public inverseBy: string
    ) {
        super(entity, property, type);
    }

    get related() {
        return this.type();
    }

    abstract match(entities: T[], relatedEntities: R[]): T[];

    abstract matchCounts(entities: T[], counts: Record<string, number>[]): T[];

    abstract async getRelatedValue(relatedEntities: R[]): Promise<R[]>;

    abstract async getRelatedCount(relatedEntities: R[]): Promise<Record<string, number>[]>;

}

export class HasOneField<T extends Entity, R extends Entity> extends InverseRelationship<T, R> {
    relationClass = HasOne;

    constructor(
        entity: EntityConstructor<T>,
        property: string,
        type: () => EntityConstructor<R>,
        inverseBy: string // TODO make it key of R
    ) {
        super(entity, property, type, inverseBy);
    }

    set(target: T, value: T[keyof T]) {
        (target[this.property as keyof T] as InstanceType<this['relationClass']>).set(value as unknown as R);
    }

    async getRelatedValue(relatedEntities: R[]) {
        const parentIds = relatedEntities.pluck(this.entity.getPrimaryKey()) as number[];
        const inverseByField = this.related.metadata.relationships[this.inverseBy];
        return await this.related.whereIn(inverseByField.column as EntityKeys<R>, parentIds).get();
    }

    async getRelatedCount(relatedEntities: R[]) {
        const relatedField = this.related.metadata.relationships[this.inverseBy];

        return await this.related.newQuery()
            .whereIn(relatedField.column, relatedEntities.pluck(this.entity.getPrimaryKey()))
            .select(relatedField.column)
            .groupBy(relatedField.column)
            .count() as unknown as Record<string, number>[];
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        entities.forEach(entity => {
            const inverseField = this.related.metadata.relationships[this.inverseBy];
            const relatedEntity = relatedEntities.find(
                related => related.original[inverseField.column as keyof object] === entity[this.entity.getPrimaryKey()]
            );
            // TODO fix these weird types. Get rid of `unknown`
            (entity[this.property as keyof T] as unknown as BelongsTo<R>).set(relatedEntity as R);
        });
        return entities;
    }

    matchCounts(entities: T[], counts: Record<string, number>[]): T[] {
        const relatedField = this.related.metadata.relationships[this.inverseBy];
        entities.forEach(entity => {
            const count = counts.findWhere(relatedField.column, entity[this.entity.getPrimaryKey()]);
            entity[this.property + 'Count' as keyof T] = (count?.aggregate ?? 0) as unknown as T[keyof T];
        });

        return entities;
    }
}

export class HasManyField<T extends Entity, R extends Entity> extends InverseRelationship<T, R> {
    relationClass = HasMany;

    constructor(entity: EntityConstructor<T>, property: string, type: () => EntityConstructor<R>, public inverseBy: string) {
        super(entity, property, type, inverseBy);
    }

    set(target: T, value: T[keyof T]) {

    }

    async getRelatedValue(relatedEntities: R[]) {
        const parentIds = relatedEntities.pluck(this.entity.getPrimaryKey()) as number[];
        const inverseByField = this.related.metadata.relationships[this.inverseBy];
        return await this.related.whereIn(inverseByField.column as EntityKeys<R>, parentIds).get();
    }

    async getRelatedCount(relatedEntities: R[]) {
        const relatedField = this.related.metadata.relationships[this.inverseBy];

        return await this.related.newQuery()
            .whereIn(relatedField.column, relatedEntities.pluck(this.entity.getPrimaryKey()))
            .select(relatedField.column)
            .groupBy(relatedField.column)
            .count() as unknown as Record<string, number>[];
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        entities.forEach(entity => {
            const inverseField = this.related.metadata.relationships[this.inverseBy];
            const relatedEntity = relatedEntities.filter(
                related => related.original[inverseField.column as keyof object] === entity[this.entity.getPrimaryKey()]
            );
            // TODO fix these weird types. Get rid of `unknown`
            (entity[this.property as keyof T] as unknown as HasMany<R, T>).items = relatedEntity;
        });
        return entities;
    }

    matchCounts(entities: T[], counts: Record<string, number>[]): T[] {
        const relatedField = this.related.metadata.relationships[this.inverseBy];
        entities.forEach(entity => {
            const count = counts.findWhere(relatedField.column, entity[this.entity.getPrimaryKey()]);
            entity[this.property + 'Count' as keyof T] = (count?.aggregate ?? 0) as unknown as T[keyof T];
        });

        return entities;
    }

    async save(items: Partial<EntityObject<R> | R>[], parent: T) {
        const entities: R[] = [];
        for await (const item of items) {
            const entity = item instanceof Entity ? item : this.type().new(item);

            entity.fill({
                [this.inverseBy]: parent
            });
            await entity.save();
            entities.push(entity as R);
        }
        return entities;
    }

    getQuery(parent: T) {
        const inverseField = this.related.metadata.relationships[this.inverseBy];
        return this.type().newQuery().where(inverseField.column, parent[parent.getPrimaryKey()] as unknown as R[keyof R]);
    }
}

export class BelongsToField<T extends Entity, R extends Entity> extends RelationshipField<T, R> {
    relationClass = BelongsTo;

    constructor(
        entity: EntityConstructor<T>,
        property: string,
        type: () => EntityConstructor<R>,
        inverseBy: string,
        column?: string
    ) {
        super(entity, property, type, inverseBy, column || property + (entity.getPrimaryKey() as string).capitalize());
    }

    set(target: T, value: T[keyof T]) {
        (target[this.property as keyof T] as InstanceType<this['relationClass']>).set(value as unknown as R);
    }

    value<K extends keyof T>(entity: T, key: string) {
        const field = entity[key as keyof T] as unknown as BelongsTo<R, T>;
        const instance = field.get();
        if (instance) {
            return instance[this.related.getPrimaryKey()];
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

    async getRelatedValue(parents: R[]) {
        const relationIds = parents
            .map(parent => {
                const relation = (parent[this.property as keyof R] as unknown as BelongsTo<R>).get();
                return relation?.[relation.getPrimaryKey()];
            })
            .filter(Boolean) as unknown as number[];
        if (relationIds.length) {
            return await this.related.whereIn(this.related.getPrimaryKey() as EntityKeys<R>, relationIds).get();
        }
        return [];
    }

    async getRelatedCount(relatedEntities: R[]) {
        return [];
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        return entities.map(entity => {
            // TODO fix these weird types. Get rid of `unknown`
            const value = (entity[this.column as keyof T] || (entity.original || {})[this.column]) as unknown as R[keyof R];
            const instance = relatedEntities.findWhere(this.related.getPrimaryKey() as keyof R, value);
            this.set(entity, instance as unknown as T[keyof T]);
            return entity;
        });
    }

    matchCounts(entities: T[], counts: Record<string, number>[]): T[] {
        return entities;
    }

    getQuery(parent: T) {
        return this.entity.newQuery().where(this.column, parent[parent.getPrimaryKey()] as unknown as T[keyof T]);
    }

    async save(items: Partial<EntityObject<R> | R>[], parent: T) {
        const entities: R[] = [];
        for await (const item of items) {
            const entity = item instanceof Entity ? item : this.entity.new(item);

            entity.fill({
                [this.property]: parent
            });
            await entity.save();
            entities.push(entity as R);
        }
        return entities;
    }
}

export class BelongsToManyField<T extends Entity, R extends Entity> extends InverseRelationship<T, R> {
    relationClass = BelongsToMany;

    constructor(
        entity: EntityConstructor<T>,
        property: string,
        type: () => EntityConstructor<R>,
        inverseBy: string,
        public table?: string,
        public parentColumn?: string,
        public relatedColumn?: string
    ) {
        super(entity, property, type, inverseBy);
    }

    set(target: T, value: T[keyof T]) {
    }

    async getRelatedValue(parents: R[]) {
        const parentIds = parents.pluck(this.entity.getPrimaryKey()) as number[];
        const relatedForeignKey = `${this.getPivotTable()}.${this.getRelatedForeignKey()}`;
        const parentForeignKey = `${this.getPivotTable()}.${this.getParentForeignKey()}`;
        const relatedKey = `${this.related.getTable()}.${this.related.getPrimaryKey()}`;

        const query = this.related.newQuery()
            .addSelect(
                new Expression(`${this.related.getTable()}.*`),
                new Expression(relatedForeignKey),
                new Expression(parentForeignKey)
            )
            .join(this.getPivotTable(), relatedForeignKey, '=', relatedKey)
            .whereIn(parentForeignKey, parentIds.unique());

        const results = await query.get();

        return results.map(entity => {
            entity.original.pivot = {
                [this.getParentForeignKey()]: entity.original[this.getParentForeignKey()],
                [this.getRelatedForeignKey()]: entity.original[this.getRelatedForeignKey()],
            };
            delete entity.original[this.getParentForeignKey()];
            delete entity.original[this.getRelatedForeignKey()];

            return entity;
        });
    }

    getParentForeignKey() {
        return this.parentColumn || `${this.entity.name.toLocaleLowerCase()}${(this.entity.getPrimaryKey() as string).capitalize()}`;
    }

    getRelatedForeignKey() {
        return this.relatedColumn || `${this.related.name.toLocaleLowerCase()}${(this.related.getPrimaryKey() as string).capitalize()}`;
    }

    async getRelatedCount(relatedEntities: R[]) {
        return [];
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        return entities.map(entity => {
            const entityPrimaryKey = entity[this.entity.getPrimaryKey()];
            (entity[this.property as keyof T] as unknown as BelongsToMany<R>).items = relatedEntities
                .filter(related => related.original.pivot[this.getParentForeignKey()] === entityPrimaryKey);
            return entity;
        });
    }

    matchCounts(entities: T[], counts: Record<string, number>[]): T[] {
        return entities;
    }

    getPivotTable() {
        return this.table || [this.entity.getTable(), this.related.getTable()].sort().join('_');
    }

    value<K extends keyof T>(entity: T, key: string): T[K] {
        const value = entity[key as K];
        if (value instanceof Array) {
            return value.map(related => {
                if (related instanceof Entity) {
                    return related;
                }
                const instance = new this.related();
                instance[instance.getPrimaryKey() as keyof R] = related as R[keyof R];
                return instance;
            }) as unknown as T[K];
        }
        return value;
    }

    async attach(items: number[], parent: T) {
        const entities: R[] = [];
        // tslint:disable-next-line:no-any
        const dataToInsert: Record<string, any>[] = [];
        for await (const item of items) {
            dataToInsert.push({
                [this.getRelatedForeignKey()]: item,
                [this.getParentForeignKey()]: parent[parent.getPrimaryKey()],
            });
            entities.push(this.related.new({[this.related.getPrimaryKey()]: item}));
        }
        if (dataToInsert.length) {
            await Query.table(this.getPivotTable()).insert(dataToInsert);
        }
        return entities;

    }

    getQuery(parent: T) {
        return this.related.newQuery().whereIn(this.related.getPrimaryKey(), query => {
            query.select(this.getRelatedForeignKey())
                .table(this.getPivotTable())
                .where(this.getParentForeignKey(), parent[parent.getPrimaryKey()] as unknown as string);
        });
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

    private instance?: T;

    constructor(
        relationship: RelationshipField<P, T>,
        parent: P
    ) {
        super(relationship, parent);
        const parentId = parent.original[relationship.column];
        if (parentId) {
            this.set(new relationship.related({[relationship.related.getPrimaryKey()]: parentId}));
        }
    }

    static relationship<T extends Entity, R extends Entity>(
        metadata: EntityMetadata<T>,
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
        );

        return metadata;
    }

    get() {
        return this.instance;
    }

    set(instance: T) {
        this.instance = instance;
    }

    async save(data: EntityObject<T> | {} | undefined = {}): Promise<T | undefined> {
        if (!this.instance) {
            return;
        }
        this.instance.fill({
            ...data,
            // [this.relationship.column]: this.parent
        });

        await this.instance.save();
        return this.instance;
    }

    toJSON() {
        return this.instance?.toJSON();
    }

}

export class HasOne<T extends Entity, P extends Entity = Entity> extends BaseRelationship<T, P> {

    public relationship: RelationshipField<P, T>;
    private instance?: T;

    static relationship<T extends Entity, R extends Entity>(
        metadata: EntityMetadata<T>,
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
        );
        return metadata;
    }

    get() {
        return this.instance;
    }

    set(instance: T | undefined) {
        this.instance = instance;
    }

    async save(instance: T | undefined = this.instance): Promise<T | undefined> {
        this.set(instance);

        if (instance) {
            (instance[this.relationship.inverseBy as keyof T] as unknown as BelongsTo<P, T>).set(this.parent);
            await instance.save();
        }

        return this.instance;
    }

    toJSON() {
        return this.instance?.toJSON();
    }
}

export class HasMany<T extends Entity, P extends Entity = Entity> extends List<T, P> {

    constructor(
        public relationship: HasManyField<P, T>,
        parent: P
    ) {
        super(relationship, parent);
    }

    static relationship<T extends Entity, R extends Entity>(
        metadata: EntityMetadata<T>,
        entityClass: EntityConstructor<T>,
        property: keyof T,
        type: () => EntityConstructor<R>,
        inverseBy: keyof R,
        options?: EntityFieldOptions
    ) {
        metadata.inverseRelationships[property as string] = new HasManyField(
            entityClass,
            property as string,
            type,
            inverseBy as string,
        );

        return metadata;
    }

    async save(...items: Partial<EntityObject<T> | T>[]) {
        if (!this.parent.exists) {
            await this.parent.save();
        }
        const instances = await this.relationship.save(items, this.parent);

        return this;
    }

    async clear() {

    }

}

export class BelongsToMany<T extends Entity, P extends Entity = Entity> extends List<T, P> {

    constructor(
        public relationship: BelongsToManyField<P, T>,
        parent: P
    ) {
        super(relationship, parent);
    }

    static relationship<T extends Entity, R extends Entity>(
        metadata: EntityMetadata<T>,
        entityClass: EntityConstructor<T>,
        property: keyof T,
        type: () => EntityConstructor<R>,
        inverseBy: keyof R,
        options?: BelongsToManyFieldOptions
    ) {
        // options.column = options.column || (property as string) + (entityClass.getPrimaryKey() as string).capitalize();

        const inverseField = metadata.inverseRelationships[inverseBy as string] as BelongsToManyField<T, R> | undefined;

        metadata.inverseRelationships[property as string] = new BelongsToManyField(
            entityClass,
            property as string,
            type,
            inverseBy as string,
            options?.table || inverseField?.table,
            options?.column || inverseField?.relatedColumn,
            options?.foreignColumn || inverseField?.parentColumn,
        );
        return metadata;
    }

    async has(item: number) {
        const relatedForeignKey = `${this.relationship.getPivotTable()}.${this.relationship.getRelatedForeignKey()}`;
        const parentForeignKey = `${this.relationship.getPivotTable()}.${this.relationship.getParentForeignKey()}`;

        return Boolean(
            await Query.table(this.relationship.getPivotTable())
                .where(parentForeignKey, this.parent[this.parent.getPrimaryKey()] as unknown as string)
                .andWhere(relatedForeignKey, item)
                .first()
        );
    }

    async attach(...items: number[]) {
        if (!this.parent.exists) {
            await this.parent.save();
        }
        this.items = this.items.concat(await this.relationship.attach(items, this.parent));

        return this.items;
    }

    async detach(...items: number[]) {
        const relatedForeignKey = `${this.relationship.getPivotTable()}.${this.relationship.getRelatedForeignKey()}`;
        const parentForeignKey = `${this.relationship.getPivotTable()}.${this.relationship.getParentForeignKey()}`;

        await Query.table(this.relationship.getPivotTable())
            .where(parentForeignKey, this.parent[this.parent.getPrimaryKey()] as unknown as string)
            .whereIn(relatedForeignKey, items)
            .delete();

        this.items = this.items.filter(item => !items.includes(item[item.getPrimaryKey()] as unknown as number));
    }

    async toggle(...items: number[]) {
        const attachedEntities = await this.relationship.getQuery(this.parent).get();
        const entitiesToDetach = items.filter(item =>
            attachedEntities.some(entity => entity[entity.getPrimaryKey()] as unknown as number === item)
        );
        const entitiesToAttach = items.filter(item =>
            attachedEntities.some(entity => entity[entity.getPrimaryKey()] as unknown as number !== item)
        );
        await this.attach(...entitiesToAttach);
        await this.detach(...entitiesToDetach);
    }

    async clear() {
        const relatedForeignKey = `${this.relationship.getPivotTable()}.${this.relationship.getRelatedForeignKey()}`;
        const parentForeignKey = `${this.relationship.getPivotTable()}.${this.relationship.getParentForeignKey()}`;

        await Query.table(this.relationship.getPivotTable())
            .where(parentForeignKey, this.parent[this.parent.getPrimaryKey()] as unknown as string)
            .whereIn(relatedForeignKey, this.items.pluck(this.relationship.related.getPrimaryKey()))
            .delete();

        this.items = [];
    }

}
