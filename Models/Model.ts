import { Constructor } from '../Support';
import { ModelField, ModelMetadataKey } from './index';

export class Model {
    static from<T extends (Model | Model[]), Q extends Model>(this: Constructor<Q>, entities: T | T[]): Q | Q[] {
        const fields: Record<string, ModelField> = Reflect.getMetadata(ModelMetadataKey, this) || {};

        if (entities instanceof Array) {
            return entities.map(entity => Model.transform<T, Q>(fields, entity));
        }
        return Model.transform<T, Q>(fields, entities);
    }

    private static transform<T, Q extends Model>(fields: Record<string, ModelField>, entity: T): Q {
        const data: Partial<Record<keyof Q, T[keyof T]>> = {};
        Object.values(fields).forEach(field => {
            if (field.type.prototype instanceof Model && entity[field.name as keyof T]) {
                const model = field.type as typeof Model;
                // @ts-ignore
                data[field.name as keyof Q] = model.from<T, Q>(entity[field.name as keyof T]);
            } else {
                data[field.name as keyof Q] = entity[field.name as keyof T];
            }
        });
        return data as Q;
    }
}
