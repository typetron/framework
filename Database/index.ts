import { ChildKeys, ChildObject, Constructor } from '../Support';
import { Entity } from './Entity';

export type EntityKeys<T extends Entity> = ChildKeys<T, Entity>;
export type EntityObject<T extends Entity> = ChildObject<T, Entity>;

export * from './Query';
export * from './Entity';
export * from './DatabaseConfig';
export * from './Decorators';
export * from './Expression';

export type EntityConstructor<T extends Entity> = typeof Entity & Constructor<T>;
