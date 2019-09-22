import { ServiceIdentifier } from './Contracts';
import { InjectableMetadata, Scope } from './Metadata';

export function Injectable(scope: Scope = Scope.SINGLETON) {
    return function <T extends Function>(target: T) {
        const metadata = Reflect.getMetadata(InjectableMetadata.KEY, target) || InjectableMetadata.DEFAULT();
        metadata.scope = scope;
        Reflect.defineMetadata(InjectableMetadata.KEY, metadata, target);
    };
}

export function Inject<T extends Object>(abstract?: ServiceIdentifier<T>) {
    return function (target: T, targetKey: string, index?: number) {
        const fieldType = Reflect.getMetadata('design:type', target, targetKey) as ServiceIdentifier<T>;
        const metadata: InjectableMetadata = Reflect.getMetadata(InjectableMetadata.KEY, target.constructor) || InjectableMetadata.DEFAULT();
        metadata.dependencies[targetKey] = fieldType;
        Reflect.defineMetadata(InjectableMetadata.KEY, metadata, target.constructor);
    };
}

