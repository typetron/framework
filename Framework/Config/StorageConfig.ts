import { BaseConfig } from './BaseConfig'
import { StorageConfiguration, StorageDiskConfig } from '@Typetron/Storage'

export class StorageConfig extends BaseConfig<StorageConfig> implements StorageConfiguration {
    default = process.env.STORAGE_DISK ?? 'local'

    disks: Record<string, StorageDiskConfig> = {
        local: {
            driver: 'local',
            root: 'storage/app',
        },
    }
}
