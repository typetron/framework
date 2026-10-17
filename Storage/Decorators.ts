import { InjectableMetadata } from '../Container'
import { Storage } from './Storage'

/**
 * Injects a storage disk, resolved on every access so `storage.fake(name)` affects already built services.
 * Omit the name to use the default disk.
 */
export function Disk(name?: string) {
    return function(target: object, property: string) {
        const metadata = InjectableMetadata.get(target.constructor)
        metadata.accessors[property] = container => container.get(Storage).disk(name)
        InjectableMetadata.set(metadata, target.constructor)
    }
}
