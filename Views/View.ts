import { Constructor } from '../Support';
import { ViewField, ViewMetadataKey } from './index';

export class View {
    static from<K extends View, Q>(this: Constructor<K>, entities: Q[]): K[] {
        const fields: {[key: string]: ViewField} = Reflect.getMetadata(ViewMetadataKey, this) || {};

        return entities.map(entity => {
            const data: { [key in keyof K]?: Q[keyof Q] } = {};
            Object.keys(fields).forEach(fieldName => {
                data[fieldName as keyof K] = entity[fieldName as keyof Q];
            });
            return data;
        }) as K[];
    }
}
