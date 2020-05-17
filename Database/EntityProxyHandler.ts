import { Entity } from './Entity';
import { EntityQuery } from './EntityQuery';
import { EntityConstructor } from './index';
import { Type } from '../Support/index';

export class EntityProxyHandler<T extends Entity> {
    constructor(private object: Type<T> | T) {
    }

    set<K extends keyof T>(target: T, prop: K, value: T[K]) {
        target[prop] = value;
        return true;
    }

    get(target: T, prop: keyof T) {
        if (!(prop in this.object)) {
            const targetConstructor = target.constructor as EntityConstructor<T>;
            const query = new EntityQuery(targetConstructor, targetConstructor.metadata);
            const queryProperty = query[prop as keyof EntityQuery<T>] as Function;
            if (typeof queryProperty === 'function') {
                // @ts-ignore
                query.table(this.object.constructor.getTable());
                return (...args: object[]) => {
                    return queryProperty.apply(query, args);
                };
            }
        }
        const value = target[prop];
        if (typeof value === 'function') {
            return value.bind(target);
        }
        return value;
    }
}
