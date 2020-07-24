import { FormMetadataKey } from './Decorators';
import { RuleValue } from '../Validation';
import { ChildKeys, ChildObject, Constructor } from '../Support';
import { FormField } from './FormFields';

export type FormFields<T> = ChildObject<T, Form>;

export abstract class Form {

    readonly errors: {[key: string]: Record<string, string>} = {};

    static fields<T extends Form>(this: Constructor<T>): Record<ChildKeys<T, Form>, FormField> {
        return Reflect.getMetadata(FormMetadataKey, this);
    }

    fields() {
        return (this.constructor as (Constructor<Form> & typeof Form)).fields();
    }

    valid() {
        const fields = Object.values(this.fields()) as FormField[];
        fields.forEach(field => {
            const errors = field.validate(this[field.name as keyof FormFields<this>]);
            if (errors) {
                this.errors[field.name] = errors;
            }
        });

        return !Object.keys(this.errors).length;
    }

    validated() {
        const fields = Object.values(this.fields()) as FormField[];
        return fields.filter(field => !this.errors[field.name])
            .reduce((obj, field) => {
                const value = this[field.name as keyof this];
                if (value) {
                    obj[field.name] = value;
                }
                return obj;
            }, <{[key: string]: RuleValue}>{});
    }

    value() {
        const fields = Object.values(this.fields()) as FormField[];
        // tslint:disable-next-line:no-any
        const value: Record<string, any> = {};
        fields.forEach(field => {
            value[field.name] = this[field.name as keyof FormFields<this>];
        });

        return value;
    }

    fill(data: Partial<FormFields<this>>) {
        const fields = Object.values(this.fields()) as FormField[];
        fields.forEach(field => {
            if (field.name in data) {
                // @ts-ignore
                this[field.name] = data[field.name];
            }
        });
    }

    toJSON() {
        return this.value();
    }
}
