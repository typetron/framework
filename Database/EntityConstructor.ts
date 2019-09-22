import { Query } from './Query';
import { Entity } from './Entity';

export interface EntityConstructor<T> {
    new(data?: object): T;

    getTable(): string;

    newQuery<Q extends Entity>(): Query<Q>;

    newInstance<Q extends Entity>(data?: object, exists?: boolean): Q;
}
