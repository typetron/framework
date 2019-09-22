import { Container } from '../Container';
import { Type } from '../Support';
import { App } from './App';
import { Provider } from './Provider';
import { AppConfig } from './AppConfig';
import { Config } from './Config/Config';
import { Configurator } from './Config/Configurator';
import { FormResolver } from './Resolvers/FormResolver';
import { ModelResolver } from './Resolvers/ModelResolver';
import { RootDir } from './RootDir';

export class Application extends Container {
    static defaultConfigDirectory = 'config';

    public config = new Config;

    constructor(public directory: string, public configDirectory = Application.defaultConfigDirectory) {
        super();
        Application.setInstance(this);
        this.set(Container, App.instance = this);
        this.set(Application, App.instance);
        this.set(RootDir, directory);

        this.loadConfig(configDirectory);
        const appConfig = this.get(AppConfig);

        this.registerResolvers();
        this.registerProviders(appConfig.providers || []);
    }

    private registerProviders(providers: Type<Provider>[]) {
        providers.forEach((provider) => {
            const instance = this.get(provider);
            instance.setApplication(this);
            instance.register();
        });
    }

    private loadConfig(configDirectory: string) {
        const configurator = this.get(Configurator);

        const path = this.directory + '/' + configDirectory;
        this.config = configurator.load(path);
        this.set(Config, this.config);
        this.config.configList.forEach(config => {
            this.set(config.constructor, config);
        });
    }

    private registerResolvers() {
        this.resolvers.unshift(new FormResolver(this));
        this.resolvers.unshift(new ModelResolver(this));
    }
}
