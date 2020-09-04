import { Query } from './Query';
import { Entity } from './Entity';
import { EntityConstructor, EntityObject, Expression } from './index';
import { KeysOfType } from '../Support';
import { BelongsTo, BelongsToMany, HasMany, HasOne } from './Fields';
import { BaseRelationship } from './ORM/BaseRelationship';

export class EntityQuery<T extends Entity> extends Query<T> {

    private eagerLoad: string[] = [];
    private eagerLoadCount: string[] = [];

    constructor(public entity: EntityConstructor<T>) {
        super();
    }

    async get<K extends keyof T>(...columns: (K | string | Expression)[]): Promise<T[]> {
        let entities = await super.get(...columns);

        entities = this.entity.hydrate(this.entity, entities, true);

        entities = await this.eagerLoadRelationships(entities);

        return await this.eagerLoadRelationshipsCounts(entities);
    }

    public async eagerLoadRelationships(entities: T[]) {
        await this.eagerLoad.forEachAsync(async (field) => {
            const relation = this.entity.metadata.allRelationships[field];
            const results = await relation.getRelatedValue(entities);
            if (results.length) {
                entities = relation.match(entities, results) as T[];
            }
        });
        return entities;
    }

    public async eagerLoadRelationshipsCounts(entities: T[]) {
        await this.eagerLoadCount.forEachAsync(async (field) => {
            const relation = this.entity.metadata.allRelationships[field];
            const results = await relation.getRelatedCount(entities);
            if (results.length) {
                entities = relation.matchCounts(entities, results) as T[];
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
        properties: Partial<EntityObject<T> | Record<string, any>>,
        values?: Partial<EntityObject<T>>
    ): Promise<T> {
        Object.entries(properties).forEach(([property, value]) => {
            const field = this.entity.metadata.columns[property] || this.entity.metadata.relationships[property];
            this.andWhere(field.column, value instanceof Entity ? value[value.getPrimaryKey()] : value);
        });
        const instance = await this.first();
        if (!instance) {
            return new this.entity({...properties, ...values});
        }
        instance.exists = true;
        return instance;
    }

    // tslint:disable-next-line:no-any
    with<K extends KeysOfType<T, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>>>(...relations: K[]) {
        this.eagerLoad = this.eagerLoad.concat(relations as string[]);

        return this;
    }

    withCount<K extends KeysOfType<T, BaseRelationship<Entity>>>(...relations: K[]) {
        this.eagerLoadCount = this.eagerLoadCount.concat(relations as string[]);

        return this;
    }
}
