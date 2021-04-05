import { RuleInterface } from '../Validation'
import { Type } from '../Support'
import { FormField } from './FormFields'
import { Form } from './Form'

export const FormMetadataKey = 'form:fields'

export function Field<T extends Form>(name?: string) {
    return function(target: T, property: string) {
        const fields: {[key: string]: FormField} = Reflect.getMetadata(FormMetadataKey, target.constructor) || {}
        const type = Reflect.getMetadata('design:type', target, property)
        const field = fields[property] || new FormField(name || property, type)
        field.name = name || property
        fields[property] = field
        Reflect.defineMetadata(FormMetadataKey, fields, target.constructor)
    }
}

// tslint:disable-next-line:no-any
export function Rules(...rules: (Type<RuleInterface> | ((...args: any[]) => Type<RuleInterface>))[]) {
    return function(target: Object, property: string) {
        const fields: {[key: string]: FormField} = Reflect.getMetadata(FormMetadataKey, target.constructor) || {}
        const type = Reflect.getMetadata('design:type', target, property)
        const field = fields[property] || new FormField(property, type)
        field.rules = rules
        fields[property] = field
        Reflect.defineMetadata(FormMetadataKey, fields, target.constructor)
    }
}
