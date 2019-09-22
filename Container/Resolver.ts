import { Container } from './Container';
import { ServiceIdentifier } from './Contracts';

export interface Resolver {
    container: Container;

    canResolve<T>(abstract: ServiceIdentifier<T>): boolean;

    resolve<T>(abstract: ServiceIdentifier<T>, parameters: object[]): T | Promise<T>;
}

export abstract class BaseResolver implements Resolver {
    constructor(public container: Container) {}

    abstract canResolve<T>(abstract: ServiceIdentifier<T>): boolean;

    abstract resolve<T>(abstract: ServiceIdentifier<T>, parameters: object[]): T | Promise<T>;
}
