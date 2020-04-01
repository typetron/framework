import { Container } from '../Container';
import { Type } from '../Support';
import { App } from './App';
import { Provider } from './Provider';
import { AppConfig } from './AppConfig';
import { Config } from './Config/Config';
import { Configurator } from './Config/Configurator';
import { FormResolver } from './Resolvers/FormResolver';
import { EntityResolver } from './Resolvers/EntityResolver';
import { RootDir } from './RootDir';
import { StaticAssetsMiddleware } from './Middleware/StaticAssetsMiddleware';
import { ErrorHandler, ErrorHandlerInterface, Handler as HttpHandler } from '../Http';

export class Application extends Container {
    static defaultConfigDirectory = 'config';

    public config = new Config;

    private constructor(public directory: string, public configDirectory = Application.defaultConfigDirectory) {
        super();
        Application.setInstance(this);
        this.set(Container, App.instance = this);
        this.set(Application, App.instance);
        this.set(RootDir, directory);
        this.set(ErrorHandlerInterface, this.get(ErrorHandler));
    }

    static async create(directory: string, configDirectory = Application.defaultConfigDirectory) {
        const app = new this(directory, configDirectory);
        await app.bootstrap();
        return app;
    }

    private registerProviders(providers: Type<Provider>[]) {
        providers.forEach((provider) => {
            const instance = this.get(provider);
            instance.setApplication(this);
            instance.register();
        });
    }

    private async loadConfig(configDirectory: string) {
        const configurator = this.get(Configurator);

        const path = this.directory + '/' + configDirectory;
        this.config = await configurator.load(path);
        this.set(Config, this.config);
        this.config.configList.forEach(config => {
            this.set(config.constructor, config);
        });
    }

    private registerResolvers() {
        this.resolvers.unshift(new FormResolver(this));
        this.resolvers.unshift(new EntityResolver(this));
    }

    private async bootstrap() {
        await this.loadConfig(this.configDirectory);

        const appConfig = this.get(AppConfig);

        if (appConfig.staticAssets) {
            appConfig.middleware.push(StaticAssetsMiddleware);
        }

        this.registerResolvers();
        this.registerProviders(appConfig.providers || []);
    }

    startServer() {
        const httpHandler = this.get(HttpHandler);
        return httpHandler.startServer(this);
    }
}
