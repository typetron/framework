import { Constructor } from '../Support';
import { ModelField, ModelMetadataKey, ModelTypeInterface } from './index';

export class Model {
    static from<T extends Model, Q extends T>(this: Constructor<T> & typeof Model, entities: Q): T {
        const fields: Record<string, ModelField> = Reflect.getMetadata(ModelMetadataKey, this) || {};

        return Model.transform<T, Q>(fields, entities);
    }

    static fromMany<T extends Model, Q extends T>(this: Constructor<T> & typeof Model, entities: Q[]): T[] {
        return entities.map(entity => this.from<T, Q>(entity));
    }

    private static transform<T, Q extends Model>(fields: Record<string, ModelField>, entity: T): Q {
        const data: Partial<Record<keyof Q, T[keyof T]>> = {};
        Object.values(fields).forEach(field => {
            const value = entity[field.name as keyof T];
            if (field.type instanceof ModelTypeInterface && value) {
                data[field.name as keyof Q] = field.type.transform(value) as T[keyof T];
            } else {
                data[field.name as keyof Q] = value;
            }
        });
        return data as Q;
    }
}
