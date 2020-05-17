export const ModelMetadataKey = 'model:fields';

export interface ModelField {
    name: string;
    type: Function;
}

export function Field(name?: string) {
    return function (target: Object, property: string) {
        const fields: Record<string, ModelField> = Reflect.getMetadata(ModelMetadataKey, target.constructor) || {};
        const type = Reflect.getMetadata('design:type', target, property) as Function;
        fields[property] = fields[property] || {name: name || property, type} as ModelField;
        Reflect.defineMetadata(ModelMetadataKey, fields, target.constructor);
    };
}

export * from './Model';
