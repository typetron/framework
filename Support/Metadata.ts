import { Constructor } from './index'

export function MetadataKey(key: string) {
    return class Metadata {
        // tslint:disable-next-line:no-any
        static get<T extends Metadata>(this: typeof Metadata & Constructor<T>, target: any, defaultValue?: T): T {
            // This handles the copy of dependencies from the parent to the child.
            // It's hacky because `newInjectable.dependencies` is a property of InjectableMetadata
            if (target.__proto__._metadata_?.['injectable'] && target.__proto__._metadata_ === target._metadata_) {
                const newInjectable = new this
                Object.assign(newInjectable, target.__proto__._metadata_['injectable'])
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                newInjectable.dependencies = {...target.__proto__._metadata_['injectable'].dependencies}
                target['_metadata_'] = {injectable: newInjectable}
                return newInjectable
            }
            return (target['_metadata_'] || (target['_metadata_'] = {[key]: new this}))[key]
                || (target['_metadata_'][key] = defaultValue ?? new this)
        }

        static set<T extends Metadata>(this: typeof Metadata & Constructor<T>, metadata: T, target: any) {
            const metadataBag = target['_metadata_'] || (target['_metadata_'] = {})
            return metadataBag[key] = metadata
        }
    }
}

export class ParametersTypesMetadata<T> extends MetadataKey('design:paramtypes') {
    parameters: T
}
