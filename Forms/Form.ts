import { FormField, FormMetadataKey } from './Decorators';
import { RuleInterface, RuleValue } from '../Validation';
import { ChildObject, Constructor } from '../Support';
import { Rule } from '../Validation/Rule';

export type FormFields<T> = ChildObject<T, Form>;

export abstract class Form {

    readonly errors: {[key: string]: string[]} = {};

    get fields(): { [key in keyof FormFields<this>]: FormField } {
        return Reflect.getMetadata(FormMetadataKey, this.constructor);
    }

    valid() {
        const fields = Object.values(this.fields) as FormField[];
        fields.forEach(field => {
            field.rules.forEach(rule => {
                if (!(rule instanceof Rule)) {
                    rule = new (rule as Constructor<RuleInterface>);
                }
                if (!rule.passes(field.name, this[field.name as keyof FormFields<this>])) {
                    const fieldErrors = this.errors[field.name] || [];
                    fieldErrors.push(rule.message(field.name, this[field.name as keyof FormFields<this>]));
                    this.errors[field.name] = fieldErrors;
                }
            });
        });

        return !Object.keys(this.errors).length;
    }

    validated() {
        const fields = Object.values(this.fields) as FormField[];
        return fields.filter(field => !this.errors[field.name])
            .reduce((obj, field) => {
                const value = this[field.name as keyof this];
                if (value) {
                    obj[field.name] = value;
                }
                return obj;
            }, <{[key: string]: RuleValue}>{});
    }

    fill(data: FormFields<this>) {
        const fields = Object.values(this.fields) as FormField[];
        fields.forEach(field => {
            // @ts-ignore
            this[field.name as keyof FormFields<this>] = data[field.name as keyof FormFields<this>];
        });
    }
}
