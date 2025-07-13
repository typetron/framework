import { Entity } from './Entity'
import { EntityQuery } from './EntityQuery'
import { EntityConstructor } from './index'

export class EntityProxyHandler<T extends Entity> {

    set<K extends keyof T>(target: T, property: string, value: T[K]) {
        target[property as keyof T] = value
        return true
    }

    get(target: T, property: string) {
        if (!(property in target)) {
            const targetConstructor = target.constructor as EntityConstructor<T>
            const query = new EntityQuery(targetConstructor)
            const queryProperty = query[property as keyof EntityQuery<T>] as Function
            if (typeof queryProperty === 'function') {
                // @ts-ignore
                query.table(target.constructor.getTable())
                return (...args: object[]) => {
                    return queryProperty.apply(query, args)
                }
            }
        }

        const value = target[property as keyof T]

        if (!value) {
            const relationships = target.metadata.allRelationships
            if (relationships[property]) {
                const relationship = new (relationships[property] as any)
                const relationshipClass = relationship.relationClass(relationships[property], target) as unknown as T[keyof T]
                return target[property as keyof T] = relationshipClass
            }
        }

        return value
        // if (typeof value === 'function') {
        //     return value.bind(target);
        // }
        // return value;
    }
}
