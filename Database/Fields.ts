import { Entity } from './Entity';
import { EntityConstructor, EntityKeys, EntityMetadata } from './index';

export interface ColumnInterface<T> {
    value<K extends keyof T>(entity: T, key: string): T[K] | T[K][] | string | number | undefined;

    relationshipColumnValue<K extends keyof T>(entity: T, value: T[K]): T[K] | T[K][] | string | number | undefined;
}

export class ColumnField<T extends Entity> implements ColumnInterface<T> {
    constructor(public parent: EntityConstructor<T>, public property: string, public type: () => Function, public column: string) {}

    value<K extends keyof T>(entity: T, key: string): T[K] | T[K][] | string | number | undefined {
        return entity[key as K];
    }

    relationshipColumnValue<K extends keyof T>(entity: T, value: T[K]): T[K] | T[K][] | string | number | undefined {
        return value;
    }
}

export abstract class Relation<T extends Entity, R extends Entity> extends ColumnField<T> {
    protected constructor(parent: EntityConstructor<T>, property: string, public type: () => EntityConstructor<R>, column: string) {
        super(parent, property, type, column);
    }

    get related() {
        return this.type();
    }

    abstract match(entities: T[], relatedEntities: R[]): T[];

    abstract async getResults(relatedEntities: R[]): Promise<R[]>;
}

export class OneToManyField<T extends Entity, R extends Entity> extends Relation<T, R> {
    constructor(parent: EntityConstructor<T>, property: string, type: () => EntityConstructor<R>, public inverseBy: string) {
        super(parent, property, type, '');
    }

    async getResults(relatedEntities: R[]) {
        const parentIds = relatedEntities.pluck(this.parent.getPrimaryKey()) as number[];
        const inverseByField = this.related.metadata.columns[this.inverseBy as keyof EntityMetadata<R>];
        return await this.related.whereIn(inverseByField.column as EntityKeys<R>, parentIds).get();
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        entities.forEach(entity => {
            const inverseField = this.related.metadata.columns[this.inverseBy];
            const relatedEntity = relatedEntities.filter(
                related => related.original[inverseField.column as keyof object] === entity[this.parent.getPrimaryKey()]
            );
            // TODO fix these weird types. Get rid of `unknown`
            entity[this.property as keyof T] = relatedEntity as unknown as T[keyof T];
        });
        return entities;
    }

}

export class ManyToOneField<T extends Entity, R extends Entity> extends Relation<T, R> {
    constructor(
        parent: EntityConstructor<T>,
        property: string,
        type: () => EntityConstructor<R>,
        public inverseBy: string,
        column: string
    ) {
        super(parent, property, type, column);
    }

    value<K extends keyof T>(entity: T, key: string) {
        if (key === this.column) {
            return new this.related({
                [this.related.getPrimaryKey()]: entity[key as K]
            }) as unknown as T[K]; // TODO get rid of `unknown`
        }
        return entity[this.property as keyof T] as unknown as T[K];
    }

    relationshipColumnValue<K extends keyof T>(entity: T, value: T[K]) {
        if (value instanceof Entity) {
            return value[value.getPrimaryKey()] as unknown as T[K];
        }
        return entity.original[this.column] as unknown as T[K];
    }

    async getResults(parents: R[]) {
        const relationIds = parents
            .pluck(parent => parent[this.column as keyof R] as unknown)
            .filter(item => item !== undefined) as number[];
        if (relationIds.length) {
            return await this.related.whereIn(this.related.getPrimaryKey() as EntityKeys<R>, relationIds).get();
        }
        return [];
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        return entities.map(entity => {
            // TODO fix these weird types. Get rid of `unknown`
            const value = (entity[this.column as keyof T] || entity.original[this.column]) as unknown as R[keyof R];
            const instance = relatedEntities.findWhere(this.related.getPrimaryKey() as keyof R, value);
            entity[this.property as keyof T] = instance as unknown as T[keyof T];
            return entity;
        });
    }
}

// export class ManyToOneInverseField<T extends Entity, R extends Entity> extends Relation<T, R> {

// }

export class ManyToManyField<T extends Entity, R extends Entity> extends Relation<T, R> {
    constructor(
        parent: EntityConstructor<T>,
        property: string,
        type: () => EntityConstructor<R>,
        public inverseBy: string,
        private table?: string,
        private parentKey?: string,
        private relatedKey?: string
    ) {
        super(parent, property, type, '');
    }

    async getResults(parents: R[]) {
        const parentIds = parents.pluck(this.parent.getPrimaryKey()) as number[];
        const relatedForeignKey = `${this.getPivotTable()}.${this.getRelatedForeignKey()}`;
        const parentForeignKey = `${this.getPivotTable()}.${this.getParentForeignKey()}`;
        const relatedKey = `${this.related.getTable()}.${this.getRelatedKey()}`;

        const results = await this.related.newQuery()
            .addSelect([relatedForeignKey, parentForeignKey])
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
        return this.parentKey || `${this.parent.name.toLocaleLowerCase()}${(this.parent.getPrimaryKey() as string).capitalize()}`;
    }

    getRelatedKey() {
        return `${this.related.getPrimaryKey()}`;
    }

    getRelatedForeignKey() {
        return this.relatedKey || `${this.related.name.toLocaleLowerCase()}${(this.related.getPrimaryKey() as string).capitalize()}`;
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        return entities.map(entity => {
            // TODO fix these weird types. Get rid of `unknown`
            const entityPrimaryKey = entity[this.parent.getPrimaryKey()];
            entity[this.property as keyof T] = relatedEntities
                .filter(related => related.original.pivot[this.getParentForeignKey()] === entityPrimaryKey) as unknown as T[keyof T];
            return entity;
        });
    }

    getPivotTable() {
        return this.table || [this.parent.getTable(), this.related.getTable()].sort().join('_');
    }

    value<K extends keyof T>(entity: T, key: string) {
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

    relationshipColumnValue<K extends keyof T>(entity: T, value: T[K]) {
        return undefined;
    }
}


