import { BaseResolver } from '../../Container'
import { Auth, AuthUserIdentifier } from '../Auth'

export class AuthResolver extends BaseResolver {

    // constructor(container: Container) {
    //     super(container);
    //     this.setScopeToRequest();
    // }

    async resolve<T>(abstract: Symbol, parameters: object[]): Promise<T> {
        const auth = this.container.get(Auth)
        return await auth.user() as unknown as T
    }

    // // tslint:disable-next-line:no-any
    // canResolve<T extends Abstract<any>>(abstract: T): boolean {
    //     return abstract.prototype instanceof User;
    // }

    canResolve<T>(abstract: Symbol): boolean {
        return abstract === AuthUserIdentifier
    }

    // private setScopeToRequest() {
    //     const metadata = InjectableMetadata.get(User);
    //     metadata.scope = Scope.REQUEST;
    //     InjectableMetadata.set(metadata, User);
    // }
}
