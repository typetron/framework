import { RuleInterface } from '../Validation';
import { Type } from '../Support';

export const FormMetadataKey = 'form:fields';

export interface FormField {
    name: string;
    rules: (Type<RuleInterface> | RuleInterface) [];
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

export function Rules(...rules: (Type<RuleInterface> | RuleInterface)[]) {
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
