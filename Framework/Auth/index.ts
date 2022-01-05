import { Container, InjectableMetadata, Scope } from '../../Container'
import { ControllerMetadata, EventMetadata, RouteMetadata } from '../../Router/Metadata'

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
            // TODO refactor this so it doesn't add the metadata to both .routes and .events
            const metadata = ControllerMetadata.get(target.constructor)

            const route = metadata.routes[property] || new RouteMetadata()
            route.parametersOverrides[parameterIndex] = async function(container: Container) {
                return await container.get(AuthUserIdentifier)
            }
            metadata.routes[property] = route

            const event = metadata.events[property] || new EventMetadata()
            event.parametersOverrides[parameterIndex] = async function(container: Container) {
                return await container.get(AuthUserIdentifier)
            }
            metadata.events[property] = event

            ControllerMetadata.set(metadata, target.constructor)
        }
    }
}
