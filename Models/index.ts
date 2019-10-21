export const ModelMetadataKey = 'model:fields';

export interface ModelField {
    name: string;
}

export function Field(name?: string) {
    return function (target: Object, property: string) {
        const fields: {[key: string]: ModelField} = Reflect.getMetadata(ModelMetadataKey, target.constructor) || {};
        const field = fields[property] || {} as ModelField;
        field.name = name || property;
        fields[property] = field;
        Reflect.defineMetadata(ModelMetadataKey, fields, target.constructor);
    };
}

export * from './Model';
