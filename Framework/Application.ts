import { Container } from '../Container';
import { Type } from '../Support';
import { App } from './App';
import { Provider } from './Provider';
import { AppConfig, BaseConfig } from './Config';
import { FormResolver } from './Resolvers/FormResolver';
import { EntityResolver } from './Resolvers/EntityResolver';
import { RootDir } from './RootDir';
import { StaticAssetsMiddleware } from './Middleware/StaticAssetsMiddleware';
import { ErrorHandler, ErrorHandlerInterface, Handler as HttpHandler } from '../Http';
import { Storage } from '../Storage';
import { AuthResolver } from './Resolvers/AuthResolver';

export class Application extends Container {
    static defaultConfigDirectory = 'config';

    public config = new Map<Function, object>();

    private constructor(public directory: string, public configDirectory = Application.defaultConfigDirectory) {
        super();
        Application.setInstance(this);
        this.set(Container, App.instance = this);
        this.set(Application, App.instance);
        this.set(RootDir, directory);
    }

    static async create(directory: string, configDirectory = Application.defaultConfigDirectory) {
        try {
            const app = new this(directory, configDirectory);
            await app.bootstrap();
            return app;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async registerProviders(providers: Type<Provider>[]) {
        await Promise.all(
            providers.map(provider => {
                const instance = this.get(provider);
                instance.setApplication(this);
                return instance.register();
            })
        );
    }

    private async loadConfig(configDirectory: string) {
        const path = this.directory + '/' + configDirectory;

        const storage = this.get(Storage);

        if (!await storage.exists(path)) {
            console.warn(`Config path '${path}' does not exist. Running with default config.`);
        }

        storage
            .files(path)
            .whereIn('extension', ['ts'])
            .forEach(file => {
                const configItem = require(file.path).default as BaseConfig<{}>;
                if (configItem && configItem.constructor) {
                    configItem.applyNewValues();
                    this.config.set(configItem.constructor, configItem);
                    this.set(configItem.constructor, configItem);
                }
            });
    }

    private registerResolvers() {
        this.resolvers.unshift(new FormResolver(this));
        this.resolvers.unshift(new EntityResolver(this));
        this.resolvers.unshift(new AuthResolver(this));
    }

    private async bootstrap() {
        await this.loadConfig(this.configDirectory);

        this.set(ErrorHandlerInterface, this.get(ErrorHandler));

        const appConfig = this.get(AppConfig);

        if (appConfig.staticAssets) {
            appConfig.middleware.push(StaticAssetsMiddleware);
        }

        this.registerResolvers();
        await this.registerProviders(appConfig.providers || []);
    }

    startServer() {
        const httpHandler = this.get(HttpHandler);
        return httpHandler.startServer(this);
    }
}
