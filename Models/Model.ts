import { Constructor } from '../Support'
import { ModelField, ModelMetadataKey, ModelTypeInterface } from './index'

export class Model {
    static from<T extends Model, Q extends object>(this: Constructor<T> & typeof Model, entity: Q): T {
        const fields: Record<string, ModelField> = Reflect.getMetadata(ModelMetadataKey, this) || {}

        return this.transform<T, Q>(fields, entity)
    }

    static fromMany<T extends Model, Q extends object>(this: Constructor<T> & typeof Model, entities: Iterable<Q>): T[] {
        return Array.from(entities).map(entity => this.from<T, Q>(entity))
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
                const v2 = value['toJSON' as keyof object] ? value?.toJSON() : value
                data[field.name as keyof T] = field.type.transform(v2) as Q[keyof Q]
            } else {
                data[field.name as keyof T] = value
            }
        });
        return data as T;
    }
}
