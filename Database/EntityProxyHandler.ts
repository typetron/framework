import { Query } from './Query';
import { Entity } from './Entity';

export class EntityProxyHandler {
    constructor(private object: typeof Entity | Entity) {
    }

    set<K extends keyof Entity>(target: Entity, prop: K, value: Entity[K]) {
        target[prop] = value;
        return true;
    }

    get(target: Entity, prop: keyof Entity) {
        if (!(prop in this.object)) {
            const query = new Query;
            const queryProperty = query[prop as keyof Query] as Function;
            if (typeof queryProperty === 'function') {
                // @ts-ignore
                query.table(this.object.constructor.getTable());
                return (...args: object[]) => {
                    return queryProperty.apply(query, args);
                };
            }
        }
        // @ts-ignore
        if ((target[prop]) === 'function') {
            return (target[prop] as Function).bind(target);
        }
        return target[prop];
    }
}
