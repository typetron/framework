import { Constructor, Type } from '../Support'
import { ClassResolver } from './ClassResolver'
import { ServiceIdentifier } from './Contracts'
import { InjectableMetadata, Scope } from './Metadata'
import { Resolver } from './Resolver'

export class Container {
    protected static instance: Container

    // TODO performance: get rid of this
    public resolvers: Resolver[] = [
        new ClassResolver(this)
    ]

    // tslint:disable-next-line:no-any
    protected instances = new Map<ServiceIdentifier<any>, any>()

    private parent?: Container

    static getInstance() {
        if (!Container.instance) {
            Container.instance = new Container()
        }

        return Container.instance
    }

    static setInstance(container: Container) {
        return Container.instance = container
    }

    getInstances() {
        return this.instances
    }

    set<T>(abstract: ServiceIdentifier<T>, concrete: T | Type<T> | (() => void)) {
        this.instances.set(abstract, concrete)
    }

    /**
     * @deprecated
     */
    forceSet<T>(abstract: ServiceIdentifier<T>, concrete: T | Type<T> | Function) {
        this.set(abstract, concrete)
    }

    // tslint:disable-next-line:no-any
    get<T>(abstract: ServiceIdentifier<T>, parameters: any[] = []): T {
        const metadata = this.getMetadata(abstract)

        if (metadata.scope === Scope.TRANSIENT) {
            return this.getResolver(abstract, metadata).resolve(abstract, parameters) as T
        }

        let concrete = this.getInstance(abstract)
        if (concrete) {
            return concrete
        }

        // if (this.parent && metadata.scope !== Scope.REQUEST
        //     && (concrete = this.parent.getInstance(abstract) ?? this.parent.get(abstract))
        // ) {
        //     return concrete
        // }

        if (this.parent && metadata.scope !== Scope.REQUEST && (concrete = this.parent.getInstance(abstract))) {
            return concrete
        }

        if (typeof abstract === 'string') {
            const instance = this.getInstance<T>(abstract) as T
            if (!instance) {
                throw new Error(`No instance found for '${this.getAbstractName(abstract)}'`)
            }
        }

        const resolver = this.getResolver(abstract, metadata)
        concrete = resolver.resolve(abstract, parameters) as T
        this.set(abstract, concrete)
        return concrete
    }

    createChildContainer(): Container {
        const childContainer = new Container()
        childContainer.parent = this
        childContainer.set(Container, childContainer)
        // TODO performance: get rid of this
        childContainer.resolvers = this.resolvers.map(resolver => {
            return new (resolver.constructor as Constructor<Resolver>)(childContainer)
        })
        return childContainer
    }

    private getMetadata<T>(abstract: ServiceIdentifier<T>) {
        if (abstract instanceof Object) {
            return InjectableMetadata.get(abstract)
        }
        return new InjectableMetadata
    }

    private getAbstractName<T>(abstract: ServiceIdentifier<T>): string {
        if (typeof abstract === 'string') {
            return abstract
        }
        if (abstract === undefined) {
            throw new Error(`
                Cannot resolve a parameter having the value undefined.
                This might be due to circular dependencies in your app
            `)
        }
        if (typeof abstract === 'symbol') {
            return abstract.toString()
        }
        if ('name' in abstract) {
            return abstract.name
        }
        throw new Error(`Cannot get abstract name for ${abstract}`)
    }

    private getResolver<T>(abstract: ServiceIdentifier<T>, metadata: InjectableMetadata) {
        let resolver = metadata.resolver
        if (!resolver) {
            resolver = this.resolvers.find(item => item.canResolve(abstract))
        }
        if (!resolver) {
            throw new Error(`Resolver not found for '${this.getAbstractName(abstract)}'`)
        }
        this.setResolverForAbstract(abstract, resolver, metadata)
        resolver.container = this
        return resolver
    }

    private setResolverForAbstract<T>(abstract: ServiceIdentifier<T>, resolver: Resolver, metadata: InjectableMetadata) {
        if (typeof abstract === 'symbol') {
            return
        }
        metadata.resolver = resolver
        InjectableMetadata.set(metadata, abstract)
    }

    private getInstance<T>(abstract: ServiceIdentifier<T>): T | undefined {
        return this.instances.get(abstract) || this.parent?.getInstance(abstract)
    }
}
