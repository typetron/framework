import { Model } from './Model'
import { Constructor } from '../Support'

export const ModelMetadataKey = 'model:fields'

export interface ModelField {
    name: string;
    type: Function | ModelTypeInterface<{}>;
}

export function Field(name?: string) {
    return function(target: Object, property: string) {
        const fields: Record<string, ModelField> = Reflect.getMetadata(ModelMetadataKey, target.constructor) || {}
        let type = Reflect.getMetadata('design:type', target, property)
        if (type.prototype instanceof Model) {
            type = new ModelType(type)
        }
        fields[property] = fields[property] || {name: name || property, type} as ModelField
        Reflect.defineMetadata(ModelMetadataKey, fields, target.constructor)
    }
}

export abstract class ModelTypeInterface<T extends Model, Q = T> {
    constructor(public model: Constructor<T> & typeof Model) {}

    abstract transform(value: Q): Q;
}

export class ModelType<T extends Model> extends ModelTypeInterface<T> {

    transform(value: T) {
        return this.model.from(value)
    }
}

export class ArrayType<T extends Model> extends ModelTypeInterface<T, T[]> {
    transform(value: T[]) {
        return Array.from(value).map(item => {
            return this.model.from(item)
        })
    }
}

export function FieldMany(type: typeof Model) {
    return function(target: Object, property: string) {
        const fields: Record<string, ModelField> = Reflect.getMetadata(ModelMetadataKey, target.constructor) || {}
        const field = fields[property] || {name: property, type: new ArrayType(type)} as ModelField
        field.type = new ArrayType(type)
        fields[property] = field
        Reflect.defineMetadata(ModelMetadataKey, fields, target.constructor)
    }
}

export * from './Model'
