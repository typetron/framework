import { Entity } from './Entity';
import { EntityQuery } from './EntityQuery';
import { EntityConstructor } from './index';
import { Type } from '../Support';

export class EntityProxyHandler<T extends Entity> {
    entityProxy: Type<T> | T;

    constructor() {
    }

    set<K extends keyof T>(target: T, property: K, value: T[K]) {
        target[property] = value;
        return true;
    }

    get(target: T, property: keyof T) {
        const relationships = target.metadata.allRelationships;
        const relationship = relationships[property as unknown as string];
        if (relationship) {
            return target[property] || (
                // @ts-ignore
                target[property] = new relationship.relationClass(relationship, this.entityProxy) as unknown as T[keyof T]
            );
        }
        if (!(property in target)) {
            const targetConstructor = target.constructor as EntityConstructor<T>;
            const query = new EntityQuery(targetConstructor);
            const queryProperty = query[property as keyof EntityQuery<T>] as Function;
            if (typeof queryProperty === 'function') {
                // @ts-ignore
                query.table(target.constructor.getTable());
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
