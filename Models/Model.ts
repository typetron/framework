import { Constructor } from '../Support';
import { ModelField, ModelMetadataKey } from './index';

export class Model {
    static from<T extends (Model | Model[]), Q extends Model>(this: Constructor<Q>, entities: T | T[]): Q | Q[] {
        const fields: {[key: string]: ModelField} = Reflect.getMetadata(ModelMetadataKey, this) || {};

        if (entities instanceof Array) {
            return entities.map(entity => Model.transform<T, Q>(fields, entity));
        }
        return Model.transform<T, Q>(fields, entities);
    }

    private static transform<T, Q extends Model>(fields: {[p: string]: ModelField}, entity: T): Q {
        const data: { [key in keyof Q]?: T[keyof T] } = {};
        Object.keys(fields).forEach(fieldName => {
            data[fieldName as keyof Q] = entity[fieldName as keyof T];
        });
        return data as Q;
    }
}
