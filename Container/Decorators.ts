import { ServiceIdentifier } from './Contracts'
import { InjectableMetadata, Scope } from './Metadata'

export function Injectable(scope: Scope = Scope.SINGLETON) {
    return function <T extends Function>(target: T) {
        const metadata = InjectableMetadata.get(target)
        metadata.scope = scope
        InjectableMetadata.set(metadata, target)
    }
}

export function Inject<T extends Object>(abstract?: ServiceIdentifier<T>) {
    return function (target: T, targetKey: string, index?: number) {
        const fieldType = Reflect.getMetadata('design:type', target, targetKey) as ServiceIdentifier<T>
        const metadata = InjectableMetadata.get(target.constructor)
        metadata.dependencies[targetKey] = abstract ?? fieldType
        InjectableMetadata.set(metadata, target.constructor)
    }
}

