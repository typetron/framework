import { ChildKeys, ChildObject, Constructor } from '../Support';
import { Entity } from './Entity';

export type EntityKeys<T extends Entity> = ChildKeys<T, Entity>;
export type EntityObject<T extends Entity> = ChildObject<T, Entity>;

export { Query } from './Query';
export { Entity } from './Entity';
export * from './DatabaseConfig';
export * from './Decorators';

export type EntityConstructor<T extends Entity> = typeof Entity & Constructor<T>;
