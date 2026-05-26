import { expect } from 'chai'
import { suite, test } from '@testdeck/mocha'
import { BaseResolver, Container, Inject, Injectable, Scope } from '../../Container'
import { ServiceIdentifier } from '../../Container/Contracts'

@suite
class ContainerTest {
    @test
    givesSingletonContainer() {
        const container = Container.getInstance()
        expect(container).instanceOf(Container)
        expect(Container.getInstance()).to.be.equal(container)
        expect(Container.getInstance()).instanceOf(Container)
    }

    @test
    overwritesSingletonContainer() {
        const container = Container.setInstance(new Container)
        expect(container).equal(Container.getInstance())
        const container2 = new Container
        Container.setInstance(container2)
        expect(container).not.equal(Container.getInstance())
        expect(container2).equal(Container.getInstance())
    }

    @test
    createsInstance() {
        const container = new Container()

        @Injectable()
        class Request {}

        expect(container.get(Request)).instanceOf(Request)
    }

    // @test
    // bindsCallbacks() {
    //     class Dependency {}
    //
    //     const container = new Container;
    //
    //     @Injectable() // not possible right now
    //     function myFunction(dependency: Dependency) {
    //         return dependency;
    //     };
    //     expect(container.call(myFunction())).to.be.instanceOf(Dependency);
    // }

    @test
    singletonScope() {
        class Request {}

        const container = new Container()
        const request = container.get(Request)
        expect(request).to.be.equal(container.get(Request))
    }

    @test
    transientScope() {
        @Injectable(Scope.TRANSIENT)
        class Request {}

        const container = new Container()
        const request1 = container.get(Request)
        const request2 = container.get(Request)
        expect(request1).not.to.be.equal(request2)
    }

    @test
    requestScope() {
        @Injectable(Scope.REQUEST)
        class Request {}

        const container = new Container()
        const childContainer = container.createChildContainer()
        const request = childContainer.get(Request)
        expect(container.getInstances().size).to.be.equal(0)
        expect(childContainer.getInstances().size).to.be.equal(2)
        expect(request).to.be.instanceof(Request)
    }

    // @test
    // requestScopeWithSingletonDependencyFromParenContainer() {
    //     @Injectable(Scope.REQUEST)
    //     class Request {}
    //
    //     class Controller {
    //         @Inject()
    //         request: Request;
    //     }
    //
    //     const container = new Container();
    //     const childContainer = container.createChildContainer();
    //     const controller = childContainer.get(Controller);
    //     expect(Object.values(container.getInstances())).to.have.length(0);
    //     expect(Object.values(childContainer.getInstances())).to.have.length(1);
    //     expect(Object.values(childContainer.getInstances())[0]).to.be.instanceof(Request);
    // }

    @test
    bindsStringToImplementation() {
        @Injectable(Scope.TRANSIENT)
        class Request {}

        const container = new Container()
        const request = container.get(Request)
        container.set('request', request)

        expect(request).to.be.equal(container.get('request'))
    }

    @test
    bindsImplementationsWithTheSameName() {
        const namespaceA = {
            Request: class Request {}
        }
        const namespaceB = {
            Request: class Request {}
        }
        const namespaceC = {
            Request: class Request {}
        }

        const container = new Container()
        const requestA = container.get(namespaceA.Request)
        const requestB = container.get(namespaceB.Request)
        const requestC = container.get(namespaceC.Request)
        expect(requestA).to.be.instanceOf(namespaceA.Request)
        expect(requestB).to.be.instanceOf(namespaceB.Request)
        expect(requestC).to.be.instanceOf(namespaceC.Request)
    }

    @test
    bindsClassToInterface() {
        abstract class StorageInterface {}

        class DiskStorage implements StorageInterface {}

        class CloudStorage implements StorageInterface {}

        const container = new Container()
        container.set(StorageInterface, new DiskStorage)
        expect(container.get(StorageInterface)).to.be.instanceOf(DiskStorage)
        container.set(StorageInterface, new CloudStorage())
        expect(container.get(StorageInterface)).to.be.instanceOf(CloudStorage)
    }

    @test
    throwsExceptionIfCannotResolve() {
        const container = new Container
        expect(() => container.get('DoesNotExist')).to.throw(`No instance found for 'DoesNotExist'`)
    }

    @test
    throwsExceptionIfCannotFindAnAbstractName() {
        const container = new Container
        const x = {} as typeof Container
        expect(() => container.get(x)).to.throw(`Cannot get abstract name for ${x}`)
    }

    @test
    resolvesDependenciesFromClassProperties() {
        const container = new Container()

        @Injectable()
        class UserRepository {
        }

        @Injectable()
        class AuthService {
            @Inject()
            userRepository: UserRepository
        }

        @Injectable()
        class UserController {
            @Inject()
            authService: AuthService
        }

        const userController = container.get(UserController)
        expect(userController).instanceOf(UserController)
        expect(userController.authService).instanceOf(AuthService)
        expect(userController.authService.userRepository).instanceOf(UserRepository)
    }

    @test
    resolvesDependenciesFromConstructorParameters() {
        const container = new Container

        @Injectable()
        class UserRepository {
        }

        @Injectable()
        class AuthService {
            constructor(public userRepository: UserRepository) {
            }
        }

        @Injectable()
        class UserController {
            constructor(public authService: AuthService) {
            }
        }

        const userController = container.get(UserController)
        expect(userController).instanceOf(UserController)
        expect(userController.authService).instanceOf(AuthService)
        expect(userController.authService.userRepository).instanceOf(UserRepository)
    }

    // @test
    // async throwsExceptionIfDependencyCannotBeResolved() {
    //     const container = new Container;
    //
    //     @Injectable()
    //     class UserController {
    //         constructor(public userRepository: object) {
    //         }
    //     }
    //
    //     await expect(() => container.get(UserController)).to.throw(`No binding found for parameter 0 in 'UserController'`);
    // }

    @test
    createsChildContainer() {
        const container = new Container()
        const childContainer = container.createChildContainer()
        expect(childContainer).to.be.instanceOf(Container)
        expect(childContainer).not.to.equal(container)
    }

    @test
    childContainerGetsObjectFromParentContainer() {
        class Storage {}

        const container = new Container()
        const childContainer = container.createChildContainer()

        const storage = container.get(Storage)
        expect(childContainer.get(Storage)).to.equal(storage)
    }

    @test
    dependenciesHaveTheScopeSingleton() {
        class Request {}

        const container = new Container()
        const childContainer = container.createChildContainer()

        const request = childContainer.get(Request)
        expect(childContainer.get(Request)).to.equal(request)
    }

    @test
    async resolvesAsyncDependencies() {
        class User {}

        class Request {
            @Inject()
            user: User
        }

        class UserResolver extends BaseResolver {
            canResolve<T>(abstract: ServiceIdentifier<T>): boolean {
                return abstract === User
            }

            async resolve<T>(abstract: ServiceIdentifier<T>, parameters: object[]): Promise<T> {
                await new Promise(resolve => setTimeout(resolve, 1))
                return new User as T
            }
        }

        const container = new Container()
        container.resolvers.unshift(new UserResolver(container))

        const request = container.get(Request)
        expect(request).to.be.instanceof(Promise)
        const resolvedRequest = await container.get(Request)
        expect(resolvedRequest).to.be.instanceof(Request)
    }

    @test
    async injectsDependencyUsingStringAlias() {
        class SomeClass {
            @Inject('theCode')
            code: number
        }

        const container = new Container()
        container.set('theCode', 123)

        const instance = container.get(SomeClass)

        expect(instance.code).to.be.equal(123)

    }

    // @test
    // async customDecorators() {
    //     class Database {
    //         debug = false;
    //
    //         async init() {
    //             this.debug = true;
    //         }
    //     }
    //
    //     function CustomDecorator() {
    //         return function (target: Object, targetKey: string) {
    //             // @ts-ignore
    //             console.log('thi ->', this);
    //             const metadata = InjectableMetadata.get(target.constructor);
    //             metadata.dependencies[targetKey] = AuthUserIdentifier;
    //             metadata.scope = Scope.REQUEST;
    //             InjectableMetadata.set(metadata, target.constructor);
    //         };
    //         // return Container.createPropertyDecorator(container => {
    //         //
    //         // });
    //     }
    //
    //     class Controller {
    //         @CustomDecorator()
    //         database: Database;
    //     }
    //
    //     const container = new Container();
    //     const controller = await container.get(Controller);
    //
    //     expect(controller.database).to.be.instanceof(Database);
    //     expect(controller.database.debug).to.equal(true);
    // }

    @test
    connectionScope() {
        @Injectable(Scope.CONNECTION)
        class ConnectionService {
            counter = 0
        }

        const appContainer = new Container()
        const connectionContainer = appContainer.createChildContainer('connection')
        const requestContainer1 = connectionContainer.createChildContainer('request')
        const requestContainer2 = connectionContainer.createChildContainer('request')

        const service1 = requestContainer1.get(ConnectionService)
        const service2 = requestContainer2.get(ConnectionService)

        // Same instance across requests in same connection
        expect(service1).to.equal(service2)

        // Cached in connection container, not in app or request containers
        expect(appContainer.getInstances().has(ConnectionService)).to.be.false
        expect(connectionContainer.getInstances().has(ConnectionService)).to.be.true
        expect(requestContainer1.getInstances().has(ConnectionService)).to.be.false
    }

    @test
    connectionScopeIsolation() {
        @Injectable(Scope.CONNECTION)
        class ConnectionService {
            counter = 0
        }

        const appContainer = new Container()
        const connection1 = appContainer.createChildContainer('connection')
        const connection2 = appContainer.createChildContainer('connection')

        const service1 = connection1.createChildContainer('request').get(ConnectionService)
        const service2 = connection2.createChildContainer('request').get(ConnectionService)

        service1.counter = 42

        // Isolated between connections
        expect(service2.counter).to.equal(0)
        expect(service1).not.to.equal(service2)
    }

    @test
    connectionScopeWithSingletonDependency() {
        @Injectable(Scope.SINGLETON)
        class Database {}

        @Injectable(Scope.CONNECTION)
        class Session {
            identifier?: string
            @Inject()
            db: Database
        }

        @Injectable()
        class Controller {
            @Inject()
            session: Session
        }

        const appContainer = new Container()
        const connection1 = appContainer.createChildContainer('connection')
        const connection2 = appContainer.createChildContainer('connection')

        const request1 = connection1.createChildContainer('request')
        const request2 = connection1.createChildContainer('request')

        const session1 = request1.get(Session)
        const session2 = connection2.createChildContainer('request').get(Session)

        // Different sessions but same database
        expect(session1).not.to.equal(session2)

        // SINGLETON controller with CONNECTION dependency
        const controller1 = request1.get(Controller)
        controller1.session.identifier = 'user-123'

        const controller2 = request2.get(Controller)

        // Session is shared within connection (CONNECTION scope)
        expect(controller1.session).to.equal(controller2.session)
        expect(controller2.session.identifier).to.equal('user-123')
    }
}
