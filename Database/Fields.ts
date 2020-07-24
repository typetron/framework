import { Entity } from './Entity';
import { EntityConstructor, EntityKeys, EntityObject, Query } from './index';
import { List } from './List';
import { RelationClass } from './ORM/RelationClass';

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

export abstract class Relationship<T extends Entity, R extends Entity> extends ColumnField<T> {
    abstract relationClass: typeof RelationClass;

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
    abstract relationClass: typeof RelationClass;

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
            entity[this.property as keyof T] = relatedEntity as unknown as T[keyof T];
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

    getQuery(parent: R) {
        // return this.entity.newQuery().where(this.column, parent[parent.getPrimaryKey()] as unknown as T[keyof T]);
        return this.entity.newQuery();
    }

    async save(items: Partial<EntityObject<T> | T>[], parent: R) {
        const entities: T[] = [];
        return entities;
    }
}

export class BelongsToField<T extends Entity, R extends Entity> extends Relationship<T, R> {
    relationClass = BelongsTo;

    constructor(
        entity: EntityConstructor<T>,
        property: string,
        type: () => EntityConstructor<R>,
        inverseBy: string,
        column: string
    ) {
        super(entity, property, type, inverseBy, column);
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
            .pluck(parent => parent[this.column as keyof R] as unknown)
            .filter(item => item !== undefined) as number[];
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
            entity[this.property as keyof T] = instance as unknown as T[keyof T];
            return entity;
        });
    }

    matchCounts(entities: T[], counts: Record<string, number>[]): T[] {
        return entities;
    }

    getQuery(parent: R) {
        return this.entity.newQuery().where(this.column, parent[parent.getPrimaryKey()] as unknown as T[keyof T]);
    }

    async save(items: Partial<EntityObject<T> | T>[], parent: R) {
        const entities: T[] = [];
        for await (const item of items) {
            const entity = item instanceof Entity ? item : this.entity.new(item);

            entity.fill({
                [this.property]: parent
            });
            await entity.save();
            entities.push(entity as T);
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
        private table?: string,
        private parentKey?: string,
        private relatedKey?: string
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

        const results = await this.related.newQuery()
            .addSelect(relatedForeignKey, parentForeignKey)
            .join(this.getPivotTable(), relatedForeignKey, '=', relatedKey)
            .whereIn(parentForeignKey, parentIds.unique())
            .get();

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
        return this.parentKey || `${this.entity.name.toLocaleLowerCase()}${(this.entity.getPrimaryKey() as string).capitalize()}`;
    }

    getRelatedForeignKey() {
        return this.relatedKey || `${this.related.name.toLocaleLowerCase()}${(this.related.getPrimaryKey() as string).capitalize()}`;
    }

    async getRelatedCount(relatedEntities: R[]) {
        return [];
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        return entities.map(entity => {
            // TODO fix these weird types. Get rid of `unknown`
            const entityPrimaryKey = entity[this.entity.getPrimaryKey()];
            entity[this.property as keyof T] = relatedEntities
                .filter(related => related.original.pivot[this.getParentForeignKey()] === entityPrimaryKey) as unknown as T[keyof T];
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

    getQuery(entity: T) {
        return this.entity.newQuery();
        // .whereIn(this.entity.getPrimaryKey(), query => query);
        // .whereIn(this.getPivotTable(), this.getParentForeignKey(), '=', this.getRelatedForeignKey());
    }

    async save(items: Partial<EntityObject<T> | T>[], parent: R) {
        const entities: T[] = [];
        // tslint:disable-next-line:no-any
        const dataToInsert: Record<string, any>[] = [];
        for await (const item of items) {
            const entity = item instanceof Entity ? item : this.entity.new(item);

            await entity.save();
            entities.push(entity as T);
            dataToInsert.push({
                [this.getParentForeignKey()]: entity[entity.getPrimaryKey()],
                [this.getRelatedForeignKey()]: parent[parent.getPrimaryKey()],
            });
        }
        if (dataToInsert.length) {
            await Query.table(this.getPivotTable()).insert(dataToInsert);
        }
        return entities;
    }
}

export interface RelationshipOptions {
    column: string;
    table: string;
}

export class BelongsTo<T extends Entity, P extends Entity = Entity> extends RelationClass<T, P> {

    public relationship: Relationship<T, P>;
    private instance?: T;

    static relationship<T extends Entity, R extends Entity>(
        entityClass: EntityConstructor<T>,
        property: keyof T,
        type: () => EntityConstructor<R>,
        inverseBy: keyof R,
        options: RelationshipOptions
    ) {
        options.column = options.column || (property as string) + (entityClass.getPrimaryKey() as string).capitalize();

        return new BelongsToField(
            entityClass, /*: EntityConstructor<T>,*/
            property as string, /*: string,*/
            type, /*: () => EntityConstructor<R>,*/
            inverseBy as string, /*: string,*/
            options.column, /*: string*/
        );
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

}

export class HasOne<T extends Entity, P extends Entity = Entity> extends RelationClass<T, P> {

    public relationship: Relationship<T, P>;
    private instance?: T;

    static relationship<T extends Entity, R extends Entity>(
        entityClass: EntityConstructor<T>,
        property: keyof T,
        type: () => EntityConstructor<R>,
        inverseBy: keyof R,
        options: RelationshipOptions
    ) {
        return new HasOneField(
            entityClass, /*: EntityConstructor<T>,*/
            property as string, /*: string,*/
            type, /*: () => EntityConstructor<R>,*/
            inverseBy as string, /*: string,*/
        );
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
        this.instance.fill(data);

        (this.instance[this.relationship.inverseBy as keyof T] as unknown as BelongsTo<P, T>).set(this.parent);

        await this.instance.save();
        return this.instance;
    }

}

export class HasMany<T extends Entity, P extends Entity = Entity> extends List<T, P> {

    static relationship<T extends Entity, R extends Entity>(
        entityClass: EntityConstructor<T>,
        property: keyof T,
        type: () => EntityConstructor<R>,
        inverseBy: keyof R,
        options: RelationshipOptions
    ) {
        return new HasManyField(
            entityClass, /*: EntityConstructor<T>,*/
            property as string, /*: string,*/
            type, /*: () => EntityConstructor<R>,*/
            inverseBy as string, /*: string,*/
        );
    }

}

export class BelongsToMany<T extends Entity, P extends Entity = Entity> extends List<T, P> {

    static relationship<T extends Entity, R extends Entity>(
        entityClass: EntityConstructor<T>,
        property: keyof T,
        type: () => EntityConstructor<R>,
        inverseBy: keyof R,
        options: RelationshipOptions
    ) {
        options.column = options.column || (property as string) + (entityClass.getPrimaryKey() as string).capitalize();

        return new BelongsToManyField(
            entityClass, /*: EntityConstructor<T>,*/
            property as string, /*: string,*/
            type, /*: () => EntityConstructor<R>,*/
            inverseBy as string, /*: string,*/
            options.table, /*: string*/
        );
    }

}
