import { Constructor } from '../Support'
import { ModelField, ModelMetadataKey, ModelTypeInterface } from './index'

export class Model {
    static async from<T extends Model, Q extends object>(this: Constructor<T> & typeof Model, entity: Promise<Iterable<Q>>): Promise<T[]>;
    static async from<T extends Model, Q extends object>(this: Constructor<T> & typeof Model, entity: Promise<Q>): Promise<T>;
    static from<T extends Model, Q extends object>(this: Constructor<T> & typeof Model, entity: Iterable<Q>): T[];
    static from<T extends Model, Q extends object>(this: Constructor<T> & typeof Model, entity: Q): T;
    static from<T extends Model, Q extends object>(
        this: Constructor<T> & typeof Model,
        entity: Q | Iterable<Q> | Promise<Q | Iterable<Q>>
    ): T | T[] | Promise<T | T[]> {
        if (entity instanceof Promise) {
            return entity.then(value => this.from(value))
        }
        if (Symbol.iterator in Object(entity)) {
            return Array.from(entity as Iterable<Q>).map(item => this.from<T, Q>(item))
        }
        const fields: Record<string, ModelField> = Reflect.getMetadata(ModelMetadataKey, this) || {}

        return this.transform<T, Q>(fields, entity as Q)
    }

    protected static transform<T, Q extends object>(fields: Record<string, ModelField>, entity: Q): T {
        const data: Partial<Record<keyof T, Q[keyof Q]>> = new this
        Object.values(fields).forEach(field => {
            if (!entity || !entity.hasOwnProperty(field.name)) {
                return
            }
            const value = entity[field.name as keyof Q]
            if (field.type instanceof ModelTypeInterface && value) {
                // @ts-ignore
                const jsonValue = value['toJSON' as keyof object] ? value?.toJSON() : value
                data[field.name as keyof T] = jsonValue ? field.type.transform(jsonValue) as Q[keyof Q] : undefined
            } else {
                data[field.name as keyof T] = value
            }
        })
        return data as T
    }
}
