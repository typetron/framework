import { Entity } from './Entity';
import { EntityQuery } from './EntityQuery';
import { EntityConstructor } from './index';

export class EntityProxyHandler {
    constructor(private object: typeof Entity | Entity) {
    }

    set<K extends keyof Entity>(target: Entity, prop: K, value: Entity[K]) {
        target[prop] = value;
        return true;
    }

    get(target: Entity, prop: keyof Entity) {
        if (!(prop in this.object)) {
            const targetConstructor = target.constructor as EntityConstructor<Entity>;
            const query = new EntityQuery(targetConstructor, targetConstructor.metadata);
            const queryProperty = query[prop as keyof EntityQuery<Entity>] as Function;
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
