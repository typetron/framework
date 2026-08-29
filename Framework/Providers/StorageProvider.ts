import { Inject } from '@Typetron/Container'
import { Storage } from '@Typetron/Storage'
import { StorageConfig } from '../Config'
import { Provider } from '../Provider'

export class StorageProvider extends Provider {
    @Inject()
    config: StorageConfig

    register(): void {
        this.app.set(Storage, new Storage(this.config))
    }
}
