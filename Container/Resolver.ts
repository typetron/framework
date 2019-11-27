import { Container } from './Container';
import { ServiceIdentifier } from './Contracts';

export interface Resolver {
    container: Container;

    canResolve<T>(abstract: ServiceIdentifier<T>): boolean;

    resolve<T>(abstract: ServiceIdentifier<T>, parameters: object[]): T | Promise<T>;

    reload<T>(abstract: ServiceIdentifier<T>, concrete: T, container?: Container): T;
}

export abstract class BaseResolver implements Resolver {
    constructor(public container: Container) {}

    abstract canResolve<T>(abstract: ServiceIdentifier<T>): boolean;

    abstract resolve<T>(abstract: ServiceIdentifier<T>, parameters: object[]): T | Promise<T>;

    /**
     * Used to update the dependencies that have the REQUEST scope
     */
    reload<T>(abstract: ServiceIdentifier<T>, concrete: T, container?: Container): T {
        return concrete;
    }
}
