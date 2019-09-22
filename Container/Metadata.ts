import { BaseResolver } from './Resolver';
import { ServiceIdentifier } from './Contracts';

export enum Scope {
    TRANSIENT = 'TRANSIENT',
    SINGLETON = 'SINGLETON',
    REQUEST = 'REQUEST',
}

export class InjectableMetadata {
    static KEY = Symbol('Injectable');

    resolver?: BaseResolver;

    scope: Scope = Scope.SINGLETON;
    dependencies: {[key: string]: ServiceIdentifier<{}>} = {};
    overwrites: {[key: string]: Function} = {};

    static DEFAULT(): InjectableMetadata {
        return new InjectableMetadata();
    }
}

