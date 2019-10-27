import { Entity } from './Entity';
import { EntityConstructor, EntityKeys, EntityMetadata } from './index';

export interface ColumnInterface<T> {
    value<K extends keyof T>(model: T, value: T[K]): T[K] | string | number | undefined;
}

export class ColumnField<T extends Entity> implements ColumnInterface<T> {
    constructor(public parent: EntityConstructor<T>, public property: string, public type: () => Function, public column: string) {}

    value<K extends keyof T>(model: T, value: T[K]): T[K] | string | number | undefined {
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
    constructor(parent: EntityConstructor<T>, property: string, type: () => EntityConstructor<R>, public inverseBy: string, column: string) {
        super(parent, property, type, column);
    }

    async getResults(relatedEntities: R[]) {
        const parentIds = relatedEntities.pluck(this.parent.getPrimaryKey()) as number[];
        const inverseByField = this.related.metadata.columns[this.inverseBy as keyof EntityMetadata<R>];
        return await this.related.whereIn(inverseByField.column as EntityKeys<R>, parentIds).get();
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        entities.forEach(entity => {
            const inverseField = this.related.metadata.columns[this.inverseBy];
            const relatedEntity = relatedEntities.filter(related => related.original[inverseField.column as keyof object] === entity[this.parent.getPrimaryKey()]);
            // TODO fix these weird types. Get rid of `unknown`
            entity[this.property as keyof T] = relatedEntity as unknown as T[keyof T];
        });
        return entities;
    }
}

export class ManyToOneField<T extends Entity, R extends Entity> extends Relation<T, R> {
    constructor(parent: EntityConstructor<T>, property: string, type: () => EntityConstructor<R>, public inverseBy: string, column: string) {
        super(parent, property, type, column);
    }

    value<K extends keyof T>(model: T, value: T[K]) {
        if (!value) {
            return;
        }
        if (value instanceof Entity) {
            return value[value.getPrimaryKey()] as unknown as T[K];
        }
        throw new Error('Many to One: Invalid value');
    }

    async getResults(parents: R[]) {
        const relationIds = parents.pluck(this.column as EntityKeys<Entity>) as number[];
        return await this.related.whereIn(this.related.getPrimaryKey() as EntityKeys<R>, relationIds).get();
    }

    match(entities: T[], relatedEntities: R[]): T[] {
        return entities.map(entity => {
            // TODO fix these weird types. Get rid of `unknown`
            const value = entity[this.column as keyof T] as unknown as R[keyof R];
            entity[this.property as keyof T] = relatedEntities.findWhere(this.related.getPrimaryKey() as keyof R, value) as unknown as T[keyof T];
            return entity;
        });
    }
}

export class ManyToManyField<T extends Entity, R extends Entity> extends Relation<T, R> {
    constructor(parent: EntityConstructor<T>, property: string, type: () => EntityConstructor<R>, public inverseBy: string, private table?: string, private parentKey?: string, private relatedKey?: string) {
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
            .whereIn(parentForeignKey, parentIds)
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
            entity[this.property as keyof T] = relatedEntities
                .filter(related => related.original.pivot[this.getParentForeignKey() as keyof object] === entity[this.parent.getPrimaryKey()]) as unknown as T[keyof T];
            return entity;
        });
    }

    private getPivotTable() {
        return this.table || [this.parent.getTable(), this.related.getTable()].sort().join('_');
    }
}


