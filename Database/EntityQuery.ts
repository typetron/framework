import { Query } from './Query';
import { Entity } from './Entity';
import { EntityConstructor, EntityMetadata, Expression } from './index';
import { KeysOfType } from '../Support';
import { Relation } from './Fields';

export class EntityQuery<T extends Entity> extends Query<T> {

    private eagerLoad: string[] = [];

    constructor(public entity: EntityConstructor<T>, public metadata: EntityMetadata<Entity>) {
        super();
    }

    async get<K extends keyof T>(columns?: (K | string | Expression)[]): Promise<T[]> {
        let entities = await super.get(columns);

        entities = await this.eagerLoadRelationships(entities);

        return this.entity.hydrate(this.entity, entities, true);
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

    async first<K extends keyof T>(columns?: (K | string | Expression)[]): Promise<T | undefined> {
        return (await this.get(columns)).first();
    }

    with<K extends KeysOfType<T, Entity | Entity[]>>(...relations: K[]) {
        this.eagerLoad = this.eagerLoad.concat(relations as string[]);

        return this;
    }
}
