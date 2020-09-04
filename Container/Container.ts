import { Constructor, Type } from '../Support';
import { ClassResolver } from './ClassResolver';
import { ServiceIdentifier } from './Contracts';
import { InjectableMetadata, Scope } from './Metadata';
import { Resolver } from './Resolver';

export class Container {
    protected static instance: Container;

    public resolvers: Resolver[] = [
        new ClassResolver(this)
    ];

    // tslint:disable-next-line:no-any
    protected instances: {[key: string]: any | Map<string, object>} = {};

    private parent?: Container;

    static getInstance() {
        if (!Container.instance) {
            Container.instance = new Container();
        }

        return Container.instance;
    }

    static setInstance(container: Container) {
        return Container.instance = container;
    }

    getInstances() {
        return this.instances;
    }

    set<T>(abstract: ServiceIdentifier<T>, concrete: T | Type<T> | Function) {
        const abstractName = this.getAbstractName(abstract);
        const currentInstance = this.instances[abstractName];
        if (typeof abstract !== 'string' && currentInstance && !(concrete instanceof (currentInstance.constructor as Type<T>))) {
            const instancesMap = new Map();
            instancesMap.set(currentInstance.constructor, currentInstance);
            instancesMap.set(abstract, concrete);
            this.instances[abstractName] = instancesMap;
        } else {
            this.instances[abstractName] = concrete;
        }
    }

    forceSet<T>(key: string, concrete: T | Type<T> | Function) {
        this.instances[key] = concrete;
    }

    get<T>(abstract: ServiceIdentifier<T>, parameters: object[] = []): T {
        const abstractName = this.getAbstractName(abstract);
        const metadata = this.getMetadata(abstract);

        if (metadata.scope === Scope.TRANSIENT) {
            return this.getResolver(abstract, abstractName, metadata).resolve(abstract, parameters) as T;
        }

        let concrete = this.getInstance(abstract);
        if (concrete) {
            return concrete;
        }
        if (this.parent && (concrete = this.parent.getInstance(abstract))) {
            return concrete;
        }
        const resolver = this.getResolver(abstract, abstractName, metadata);
        concrete = resolver.resolve(abstract, parameters) as T;
        this.set(abstract, concrete);
        return concrete;
    }

    createChildContainer(): Container {
        const childContainer = new Container();
        childContainer.parent = this;
        childContainer.resolvers = this.resolvers.map(resolver => {
            return new (resolver.constructor as Constructor<Resolver>)(childContainer);
        });
        return childContainer;
    }

    private getMetadata<T>(abstract: ServiceIdentifier<T>) {
        if (abstract instanceof Object) {
            return InjectableMetadata.get(abstract);
        }
        return new InjectableMetadata;
    }

    private getAbstractName<T>(abstract: ServiceIdentifier<T>): string {
        if (typeof abstract === 'string') {
            return abstract;
        }
        if (abstract === undefined) {
            throw new Error(`
                Cannot resolve a parameter having the value undefined.
                This might be due to circular dependencies in your app
            `);
        }
        if (typeof abstract === 'symbol') {
            return abstract.toString();
        }
        if ('name' in abstract) {
            return abstract.name;
        }
        throw new Error(`Cannot get abstract name for ${abstract}`);
    }

    private getResolver<T>(abstract: ServiceIdentifier<T>, abstractName: string, metadata: InjectableMetadata) {
        let resolver = metadata.resolver;
        if (!resolver) {
            resolver = this.resolvers.find(item => item.canResolve(abstract));
        }
        if (!resolver) {
            throw new Error(`Resolver not found for '${abstractName}'`);
        }
        this.setResolverForAbstract(abstract, resolver, metadata);
        resolver.container = this;
        return resolver;
    }

    private setResolverForAbstract<T>(abstract: ServiceIdentifier<T>, resolver: Resolver, metadata: InjectableMetadata) {
        if (typeof abstract === 'symbol') {
            return;
        }
        metadata.resolver = resolver;
        InjectableMetadata.set(metadata, abstract);
    }

    private getInstance<T>(abstract: ServiceIdentifier<T>): T | undefined {
        const abstractName = this.getAbstractName(abstract);
        let instance = this.instances[abstractName];
        if (instance instanceof Map) {
            instance = instance.get(abstract);
        }
        if (instance &&
            this.getAbstractName(instance.constructor) === abstractName &&
            !(instance instanceof (abstract as Function))
        ) {
            return undefined;
        }
        return instance;
    }
}
