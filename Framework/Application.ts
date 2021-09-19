import { Container } from '../Container'
import { Type } from '../Support'
import { App } from './App'
import { Provider } from './Provider'
import { AppConfig, AuthConfig, BaseConfig } from './Config'
import { FormResolver } from './Resolvers/FormResolver'
import { EntityResolver } from './Resolvers/EntityResolver'
import { RootDir } from './RootDir'
import { StaticAssetsMiddleware } from './Middleware/StaticAssetsMiddleware'
import { ErrorHandler, ErrorHandlerInterface, Handler as HttpHandler } from '../Router/Http'
import { Storage } from '../Storage'
import { AuthResolver } from './Resolvers/AuthResolver'
import fileSystem from 'fs'
import path from 'path'
import { WebsocketsProvider } from './Providers/WebsocketsProvider'

export class Application extends Container {
    static defaultConfigDirectory = 'config'

    public config = new Map<Function, object>()

    constructor(public directory: string, public configDirectory = Application.defaultConfigDirectory) {
        super()
        Application.setInstance(this)
        this.set(Application, App.instance = this)
        this.set(Container, this)
        this.set(RootDir, directory)
    }

    static async create(directory: string, configDirectory = Application.defaultConfigDirectory) {
        const app = new this(fileSystem.realpathSync.native(directory), configDirectory)
        await app.bootstrap()
        return app
    }

    async startServer() {
        const httpHandler = this.get(HttpHandler)

        const appConfig = this.get(AppConfig)

        if (appConfig.websocketsPort) {
            await this.registerProviders([WebsocketsProvider])
        }

        return httpHandler.startServer(this)
    }

    public async registerProviders(providers: Type<Provider>[]) {
        await Promise.all(
            providers.map(provider => {
                const instance = this.get(provider)
                return instance.register()
            })
        )
    }

    private async loadConfig(configDirectory: string) {
        const configsPath = path.join(this.directory, configDirectory)

        const storage = this.get(Storage)

        if (!await storage.exists(configsPath)) {
            console.warn(`Config path '${configsPath}' does not exist. Running with default config.`)
        }

        storage
            .files(configsPath)
            .whereIn('extension', ['ts'])
            .forEach(file => {
                const configItem = require(file.path).default as BaseConfig<{}>
                if (configItem && configItem.constructor) {
                    configItem.applyNewValues()
                    this.config.set(configItem.constructor, configItem)
                    this.set(configItem.constructor, configItem)
                }
            })
    }

    private registerResolvers() {
        this.resolvers.unshift(new FormResolver(this))
        this.resolvers.unshift(new EntityResolver(this))
        this.resolvers.unshift(new AuthResolver(this))
    }

    private async bootstrap() {
        await this.loadConfig(this.configDirectory)

        this.set(ErrorHandlerInterface, this.get(ErrorHandler))

        const appConfig = this.get(AppConfig)
        await this.checkAppSecret()

        if (appConfig.staticAssets) {
            appConfig.middleware.unshift(StaticAssetsMiddleware)
        }

        this.registerResolvers()

        const providers = appConfig.providers || []

        await this.registerProviders(providers)
    }

    private async checkAppSecret() {
        const authConfig = this.get(AuthConfig)
        if (!authConfig.signature) {
            throw new Error(`APP_SECRET is not setup in your '.env' file.`)
        }
    }
}
