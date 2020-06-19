import { Entity } from './Entity';
import { EntityQuery } from './EntityQuery';
import { EntityConstructor } from './index';
import { Type } from '../Support';
import { BelongsToManyField, HasManyField } from './Fields';
import { List } from './List';

export class EntityProxyHandler<T extends Entity> {
    constructor(private object: Type<T> | T) {
    }

    set<K extends keyof T>(target: T, property: K, value: T[K]) {
        target[property] = value;
        return true;
    }

    get(target: T, property: keyof T) {
        const relationships = {...target.metadata.relationships, ...target.metadata.inverseRelationships};
        const relationship = relationships[property as unknown as string];
        if (relationship && (relationship instanceof HasManyField || relationship instanceof BelongsToManyField)) {
            return target[property] ||
                (target[property] = new List(relationship.related, target, relationship.inverseBy) as unknown as T[keyof T]);
        }
        if (!(property in this.object)) {
            const targetConstructor = target.constructor as EntityConstructor<T>;
            const query = new EntityQuery(targetConstructor);
            const queryProperty = query[property as keyof EntityQuery<T>] as Function;
            if (typeof queryProperty === 'function') {
                // @ts-ignore
                query.table(this.object.constructor.getTable());
                return (...args: object[]) => {
                    return queryProperty.apply(query, args);
                };
            }
        }

        return target[property];
        // if (typeof value === 'function') {
        //     return value.bind(target);
        // }
        // return value;
    }
}
