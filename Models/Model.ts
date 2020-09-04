import { Constructor } from '../Support';
import { ModelField, ModelMetadataKey, ModelTypeInterface } from './index';

export class Model {
    static from<T extends Model, Q extends object>(this: Constructor<T> & typeof Model, entity: Q): T {
        const fields: Record<string, ModelField> = Reflect.getMetadata(ModelMetadataKey, this) || {};

        return Model.transform<T, Q>(fields, entity);
    }

    static fromMany<T extends Model, Q extends object>(this: Constructor<T> & typeof Model, entities: Q[]): T[] {
        return entities.map(entity => this.from<T, Q>(entity));
    }

    private static transform<T, Q extends object>(fields: Record<string, ModelField>, entity: Q): T {
        if (entity['toJSON' as keyof object]) {
            // @ts-ignore
            entity = entity?.toJSON() || {};
        }
        const data: Partial<Record<keyof T, Q[keyof Q]>> = {};
        Object.values(fields).forEach(field => {
            if (!entity.hasOwnProperty(field.name)) {
                return;
            }
            const value = entity[field.name as keyof Q];
            if (field.type instanceof ModelTypeInterface && value) {
                data[field.name as keyof T] = field.type.transform(value) as Q[keyof Q];
            } else {
                data[field.name as keyof T] = value;
            }
        });
        return data as T;
    }
}
