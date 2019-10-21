import { Query } from './Query';
import { Entity } from './Entity';
import { EntityConstructor } from './index';

export class EntityQuery<T extends Entity> extends Query<T> {
    constructor(public entity: EntityConstructor<T>) {
        super();
    }

    async get<K extends keyof T>(columns?: (K | string)[]): Promise<T[]> {
        const records = await super.get(columns);
        return this.entity.hydrate(this.entity, records, true);
    }

    async first<K extends keyof T>(columns?: (K | string)[]): Promise<T | undefined> {
        const data = await super.first(columns);
        return this.entity.newInstance(data, true);
    }
}
