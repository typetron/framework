import { InjectableMetadata, Scope } from '../../Container'

export * from './Auth'
export * from './User'
export * from './Authenticable'

export const AuthUserIdentifier = Symbol('framework.auth:userIdentifier')

export function AuthUser() {
    return function (target: Object, targetKey: string) {
        const metadata = InjectableMetadata.get(target.constructor)
        metadata.dependencies[targetKey] = AuthUserIdentifier
        metadata.scope = Scope.REQUEST
        InjectableMetadata.set(metadata, target.constructor)
    }
}
