import { ChildKeys, ChildObject } from '../Support';
import { Entity } from './Entity';

export type EntityKeys<T extends Entity> = ChildKeys<T, Entity>;
export type EntityObject<T extends Entity> = ChildObject<T, Entity>;

export { Query } from './Query';
export { Entity as EntityBase } from './Entity';
export * from './DatabaseConfig';
