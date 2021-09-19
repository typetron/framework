import { ChildKeys, ChildObject, Constructor } from '../Support'
import { Entity } from './Entity'
import { BaseRelationship } from './ORM/BaseRelationship'

export type EntityKeys<T extends Entity> = ChildKeys<T, Entity>;
export type EntityColumns<T extends Entity> = { [P in EntityKeys<T>]: T[P] extends Function ? never : P }[ EntityKeys<T>]

export type EntityObject<T extends Entity> = ChildObject<{
    [P in keyof T]: T[P] extends BaseRelationship<infer U> ? U | number : T[P]
}, Entity>;
export type EntityConstructor<T extends Entity> = typeof Entity & Constructor<T>;
// export type EntityConstructor<T extends Entity> = {[key in keyof typeof Entity]: (typeof Entity)[key]} & Constructor<T>;
export type DotNotationProperties<T> = string;

export * from './Query'
export * from './Entity'
export * from './Decorators'
export * from './Expression'
export * from './Drivers'
export * from './Fields'
export * from './Connection'

