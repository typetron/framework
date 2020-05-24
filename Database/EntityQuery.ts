import { Query } from './Query';
import { Entity } from './Entity';
import { EntityConstructor, EntityMetadata, Expression } from './index';
import { ChildObject, KeysOfType } from '../Support';
import { Relation } from './Fields';

export class EntityQuery<T extends Entity> extends Query<T> {

    private eagerLoad: string[] = [];
    private eagerLoadCount: string[] = [];

    constructor(public entity: EntityConstructor<T>, public metadata: EntityMetadata<Entity>) {
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
            const relation = this.metadata.columns[field as keyof EntityMetadata] as Relation<T, Entity>;
            const results = await relation.getResults(entities);
            if (results.length) {
                entities = relation.match(entities, results);
            }
        });
        return entities;
    }

    public async eagerLoadRelationshipsCounts(entities: T[]) {
        await this.eagerLoadCount.forEachAsync(async (field) => {
            const relation = this.metadata.columns[field as keyof EntityMetadata] as Relation<T, Entity>;
            const results = await relation.getResultsCount(entities);
            if (results.length) {
                entities = relation.matchCounts(entities, results);
            }
        });
        return entities;
    }

    async first<K extends keyof T>(...columns: (K | string | Expression)[]): Promise<T | undefined> {
        return (await super.first(...columns));
    }

    async firstOrNew<K extends keyof T>(
        // tslint:disable-next-line:no-any
        properties: ChildObject<T, Entity> | Record<string, any>,
        values?: ChildObject<this, Entity>
    ): Promise<T> {
        Object.entries(properties).forEach(([property, value]) => {
            const relation = this.metadata.columns[property] as Relation<T, Entity>;
            this.andWhere(relation.column, value[relation.type().getPrimaryKey()]);
        });
        const instance = await this.first();
        return instance ?? new this.entity({...properties, ...values});
    }

    with<K extends KeysOfType<T, Entity | Entity[]>>(...relations: K[]) {
        this.eagerLoad = this.eagerLoad.concat(relations as string[]);

        return this;
    }

    withCount<K extends KeysOfType<T, Entity | Entity[]>>(...relations: K[]) {
        this.eagerLoadCount = this.eagerLoadCount.concat(relations as string[]);

        return this;
    }
}
