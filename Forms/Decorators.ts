import { Rule } from '../Validation';

export const FormMetadataKey = 'form:fields';

export interface FormField {
    name: string;
    rules: Rule[];
}

export function Field<T>(name?: string) {
    return function (target: Object, property: string) {
        const fields: {[key: string]: FormField} = Reflect.getMetadata(FormMetadataKey, target.constructor) || {};
        const emptyField: FormField = {
            name: '',
            rules: []
        };
        const field = fields[property] || emptyField;
        field.name = name || property;
        fields[property] = field;
        Reflect.defineMetadata(FormMetadataKey, fields, target.constructor);
    };
}

export function Rules(...rules: Rule[]) {
    return function (target: Object, property: string) {
        const fields: {[key: string]: FormField} = Reflect.getMetadata(FormMetadataKey, target.constructor) || {};
        const emptyField: FormField = {
            name: '',
            rules: []
        };
        const field = fields[property] || emptyField;
        field.rules = rules;
        fields[property] = field;
        Reflect.defineMetadata(FormMetadataKey, fields, target.constructor);
    };
}
