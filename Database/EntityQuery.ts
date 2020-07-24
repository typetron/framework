import { Query } from './Query';
import { Entity } from './Entity';
import { EntityConstructor, Expression } from './index';
import { ChildObject, KeysOfType } from '../Support';
import { BelongsTo, BelongsToMany, HasMany, HasOne, InverseRelationship, Relationship } from './Fields';

export class EntityQuery<T extends Entity> extends Query<T> {

    private eagerLoad: string[] = [];
    private eagerLoadCount: string[] = [];

    constructor(public entity: EntityConstructor<T>) {
        super();
    }

    async get<K extends keyof T>(...columns: (K | string | Expression)[]): Promise<T[]> {
        let entities = await super.get(...columns);

        entities = await this.eagerLoadRelationships(entities);

        entities = this.entity.hydrate(this.entity, entities, true);
        return await this.eagerLoadRelationshipsCounts(entities);
    }

    public async eagerLoadRelationships(entities: T[]) {
        await this.eagerLoad.forEachAsync(async (field) => {
            const relation = this.entity.metadata.allRelationships[field] as Relationship<T, Entity> | InverseRelationship<T, Entity>;
            const results = await relation.getRelatedValue(entities);
            if (results.length) {
                entities = relation.match(entities, results);
            }
        });
        return entities;
    }

    public async eagerLoadRelationshipsCounts(entities: T[]) {
        await this.eagerLoadCount.forEachAsync(async (field) => {
            const relation = this.entity.metadata.allRelationships[field] as Relationship<T, Entity> | InverseRelationship<T, Entity>;
            const results = await relation.getRelatedCount(entities);
            if (results.length) {
                entities = relation.matchCounts(entities, results);
            }
        });
        return entities;
    }

    async first<K extends keyof T>(...columns: (K | string | Expression)[]): Promise<T | undefined> {
        const entityData = await super.first(...columns);
        if (!entityData) {
            return undefined;
        }
        let entity = this.entity.new(entityData);

        entity = (await this.eagerLoadRelationships([entity])).first();
        return entity;
    }

    async firstOrNew<K extends keyof T>(
        // tslint:disable-next-line:no-any
        properties: Partial<ChildObject<T, Entity> | Record<string, any>>,
        values?: Partial<ChildObject<T, Entity>>
    ): Promise<T> {
        Object.entries(properties).forEach(([property, value]) => {
            // TODO inside entity metadata add: columns, relations, inverseRelations.
            // This way we can get rid of `as ColumnField<Entity>` from framework.
            const column = this.entity.metadata.columns[property];
            this.andWhere(column.column, value);
        });
        const instance = await this.first();
        return instance ?? new this.entity({...properties, ...values});
    }

    // tslint:disable-next-line:no-any
    with<K extends KeysOfType<T, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>>>(...relations: K[]) {
        this.eagerLoad = this.eagerLoad.concat(relations as string[]);

        return this;
    }

    withCount<K extends KeysOfType<T, Entity | Entity[]>>(...relations: K[]) {
        this.eagerLoadCount = this.eagerLoadCount.concat(relations as string[]);

        return this;
    }
}
