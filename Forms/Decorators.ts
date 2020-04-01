import { RuleInterface } from '../Validation';
import { Type } from '../Support';
import { FormField } from './FormFields';

export const FormMetadataKey = 'form:fields';

export function Field<T>(name?: string) {
    return function (target: Object, property: string) {
        const fields: {[key: string]: FormField} = Reflect.getMetadata(FormMetadataKey, target.constructor) || {};
        const type = Reflect.getMetadata('design:type', target, property);
        const field = fields[property] || new FormField(name || property, type);
        field.name = name || property;
        fields[property] = field;
        Reflect.defineMetadata(FormMetadataKey, fields, target.constructor);
    };
}

export function Rules(...rules: (Type<RuleInterface> | RuleInterface)[]) {
    return function (target: Object, property: string) {
        const fields: {[key: string]: FormField} = Reflect.getMetadata(FormMetadataKey, target.constructor) || {};
        const type = Reflect.getMetadata('design:type', target, property);
        const field = fields[property] || new FormField(property, type);
        field.rules = rules;
        fields[property] = field;
        Reflect.defineMetadata(FormMetadataKey, fields, target.constructor);
    };
}
