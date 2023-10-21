import { Container, InjectableMetadata, Scope } from '../../Container'
import { ControllerMetadata, MethodMetadata } from '../../Router/Metadata'

export * from './Auth'
export * from './User'
export * from './Authenticatable'

export const AuthUserIdentifier = Symbol('framework.auth:userIdentifier')

export function AuthUser() {
    return function(target: object, property: string, parameterIndex?: number) {
        if (parameterIndex === undefined) {
            const metadata = InjectableMetadata.get(target.constructor)
            metadata.dependencies[property] = AuthUserIdentifier
            metadata.scope = Scope.REQUEST
            InjectableMetadata.set(metadata, target.constructor)
        } else {
            const metadata = ControllerMetadata.get(target.constructor)

            const methodMetadata = metadata.methods[property] || new MethodMetadata()
            methodMetadata.parametersOverrides[parameterIndex] = async function(container: Container) {
                return await container.get(AuthUserIdentifier)
            }
            metadata.methods[property] = methodMetadata

            ControllerMetadata.set(metadata, target.constructor)
        }
    }
}
