import { Constructor } from '../Support';
import { ModelField, ModelMetadataKey } from './index';

export class Model {
    static from<K extends Model, Q>(this: Constructor<K>, entities: Q[]): K[] {
        const fields: {[key: string]: ModelField} = Reflect.getMetadata(ModelMetadataKey, this) || {};

        return entities.map(entity => {
            const data: { [key in keyof K]?: Q[keyof Q] } = {};
            Object.keys(fields).forEach(fieldName => {
                data[fieldName as keyof K] = entity[fieldName as keyof Q];
            });
            return data;
        }) as K[];
    }
}
