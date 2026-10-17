import { Resolver } from './Resolver'
import { ServiceIdentifier } from './Contracts'
import { MetadataKey } from '../Support/Metadata'
import type { Container } from './Container'

/** Resolves a property's value each time it is read */
export type PropertyAccessor = (container: Container) => unknown

export enum Scope {
    TRANSIENT = 'TRANSIENT',
    SINGLETON = 'SINGLETON',
    REQUEST = 'REQUEST',
    CONNECTION = 'CONNECTION',
}

export class InjectableMetadata extends MetadataKey('injectable') {
    resolver?: Resolver

    scope: Scope = Scope.SINGLETON
    dependencies: {[key: string]: ServiceIdentifier<{}>} = {}
    accessors: {[key: string]: PropertyAccessor} = {}
}
