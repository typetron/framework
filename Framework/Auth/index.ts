import { Container, InjectableMetadata, Scope } from '../../Container'
import { ControllerMetadata, RouteMetadata } from '@Typetron/Router/Metadata'
import { Request } from '@Typetron/Web'

export * from './Auth'
export * from './User'
export * from './Authenticatable'

export const AuthUserIdentifier = Symbol('framework.auth:userIdentifier')

export function AuthUser() {
    return function (target: Object, property: string, parameterIndex?: number) {
        if (parameterIndex === undefined) {
            const metadata = InjectableMetadata.get(target.constructor)
            metadata.dependencies[property] = AuthUserIdentifier
            metadata.scope = Scope.REQUEST
            InjectableMetadata.set(metadata, target.constructor)
        } else {
            const metadata = ControllerMetadata.get(target.constructor)

            const route = metadata.routes[property] || new RouteMetadata()
            route.parametersOverrides[parameterIndex] = async function (request: Request, container: Container) {
                return await container.get(AuthUserIdentifier)
            }

            metadata.routes[property] = route
            ControllerMetadata.set(metadata, target.constructor)
        }
    }
}
