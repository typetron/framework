export const ViewMetadataKey = 'view:fields';

export interface ViewField {
    name: string;
}

export function Field(name?: string) {
    return function (target: Object, property: string) {
        const fields: {[key: string]: ViewField} = Reflect.getMetadata(ViewMetadataKey, target.constructor) || {};
        const field = fields[property] || {} as ViewField;
        field.name = name || property;
        fields[property] = field;
        Reflect.defineMetadata(ViewMetadataKey, fields, target.constructor);
    };
}

export * from './View';
