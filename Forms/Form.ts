import { FormField, FormMetadataKey } from '.';
import { RuleValue } from '../Validation';
import { Injectable } from '../Container';
import { ChildObject } from '../Support';

type FormFields<T extends Form<T>> = ChildObject<T, Form<T>>;

@Injectable()
export abstract class Form<T extends Form<T>> {

    errors: {[key: string]: string[]} = {};

    constructor(public data: FormFields<T>) {
        // @ts-ignore
        this.loadData(data);
    }

    get fields(): { [key in keyof FormFields<T>]: FormField } {
        return Reflect.getMetadata(FormMetadataKey, this.constructor);
    }

    valid() {
        const fields = Object.values(this.fields) as FormField[];
        fields.forEach(field => {
            field.rules.forEach(rule => {
                if (!rule.passes(field.name, this.data[field.name as keyof FormFields<T>])) {
                    const fieldErrors = this.errors[field.name] || [];
                    fieldErrors.push(rule.message(field.name, this.data[field.name as keyof FormFields<T>]));
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
                const value = this[field.name as keyof this] || this.data[field.name as keyof FormFields<T>];
                if (value) {
                    obj[field.name] = value;
                }
                return obj;
            }, <{[key: string]: RuleValue}>{});
    }

    loadData(this: T, data: FormFields<T>) {
        const fields = Object.values(this.fields) as FormField[];
        fields.forEach(field => {
            // @ts-ignore
            this[field.name as keyof FormFields<T>] = data[field.name as keyof FormFields<T>];
        });
    }
}
