import { Resolver } from './Resolver'
import { ServiceIdentifier } from './Contracts'
import { MetadataKey } from '../Support/Metadata'

export enum Scope {
    TRANSIENT = 'TRANSIENT',
    SINGLETON = 'SINGLETON',
    REQUEST = 'REQUEST',
}

export class InjectableMetadata extends MetadataKey('injectable') {
    resolver?: Resolver

    scope: Scope = Scope.SINGLETON
    dependencies: {[key: string]: ServiceIdentifier<{}>} = {}
}
