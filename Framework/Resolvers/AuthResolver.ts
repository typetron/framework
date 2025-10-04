import { BaseResolver } from '../../Container'
import { Auth, AuthUserIdentifier } from '../Auth'

export class AuthResolver extends BaseResolver {

    async resolve<T>(abstract: symbol, parameters: object[]): Promise<T> {
        const auth = this.container.get(Auth)
        if (!auth.identifier) {
            return undefined as unknown as T
        }
        return await auth.user() as unknown as T
    }

    canResolve<T>(abstract: symbol): boolean {
        return abstract === AuthUserIdentifier
    }

    // private setScopeToRequest() {
    //     const metadata = InjectableMetadata.get(User);
    //     metadata.scope = Scope.REQUEST;
    //     InjectableMetadata.set(metadata, User);
    // }
}
