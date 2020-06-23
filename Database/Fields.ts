import { Entity } from './Entity';
import { EntityConstructor, EntityKeys } from './index';

export interface EntityField<T extends Entity> {

    value<K extends keyof T>(entity: T, key: string): T[K] | T[K][] | string | number | undefined;
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
}

export class InverseField<T extends Entity> implements EntityField<T> {
    constructor(
        public entity: EntityConstructor<T>,
        public property: string,
        public type: () => Function
    ) {}

    value<K extends keyof T>(entity: T, key: string): T[K] | T[K][] | string | number | undefined {
        return entity[key as K];
    }

    // relationshipColumnValue<K extends keyof T>(entity: T, value: T[K]): T[K] | T[K][] | string | number | undefined {
    //     return value;
    // }
}

export class PrimaryField<T extends Entity> extends ColumnField<T> {
}

export abstract class Relationship<T extends Entity, R extends Entity> extends ColumnField<T> {
    protected constructor(
        parent: EntityConstructor<T>,
        property: string,
        public type: () => EntityConstructor<R>,
        public inverseBy: string,
        column: string
    ) {
        super(parent, property, type, column);
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
    protected constructor(
        parent: EntityConstructor<T>,
        property: string,
        public type: () => EntityConstructor<R>,
        public inverseBy: string
    ) {
        super(parent, property, type);
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
    constructor(
        parent: EntityConstructor<T>,
        property: string,
        type: () => EntityConstructor<R>,
        inverseBy: string // TODO make it key of R
    ) {
        super(parent, property, type, inverseBy);
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
}

export class HasManyField<T extends Entity, R extends Entity> extends InverseRelationship<T, R> {
    constructor(parent: EntityConstructor<T>, property: string, type: () => EntityConstructor<R>, public inverseBy: string) {
        super(parent, property, type, inverseBy);
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
}

export class BelongsToField<T extends Entity, R extends Entity> extends Relationship<T, R> {
    constructor(
        parent: EntityConstructor<T>,
        property: string,
        type: () => EntityConstructor<R>,
        inverseBy: string,
        column: string
    ) {
        super(parent, property, type, inverseBy, column);
    }

    value<K extends keyof T>(entity: T, key: string) {
        return entity[key as keyof T][this.related.getPrimaryKey()];
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
}

export class BelongsToManyField<T extends Entity, R extends Entity> extends InverseRelationship<T, R> {
    constructor(
        parent: EntityConstructor<T>,
        property: string,
        type: () => EntityConstructor<R>,
        inverseBy: string,
        private table?: string,
        private parentKey?: string,
        private relatedKey?: string
    ) {
        super(parent, property, type, inverseBy);
    }

    async getRelatedValue(parents: R[]) {
        const parentIds = parents.pluck(this.entity.getPrimaryKey()) as number[];
        const relatedForeignKey = `${this.getPivotTable()}.${this.getRelatedForeignKey()}`;
        const parentForeignKey = `${this.getPivotTable()}.${this.getParentForeignKey()}`;
        const relatedKey = `${this.related.getTable()}.${this.getRelatedKey()}`;

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

    getRelatedKey() {
        return `${this.related.getPrimaryKey()}`;
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
}


