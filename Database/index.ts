import { ChildKeys, ChildObject, Constructor } from '../Support';
import { Entity } from './Entity';
import { BaseRelationship } from './ORM/BaseRelationship';

export type EntityKeys<T extends Entity> = ChildKeys<T, Entity>;
export type EntityObject<T extends Entity> = ChildObject<{
    [P in keyof T]: T[P] extends BaseRelationship<infer U> ? U : T[P]
}, Entity>;
export type EntityConstructor<T extends Entity> = typeof Entity & Constructor<T>;

export * from './Query';
export * from './Entity';
export * from './Decorators';
export * from './Expression';
export * from './Schema';
export * from './Connection';

