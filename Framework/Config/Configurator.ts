import { Inject } from '../../Container';
import { Storage } from '../../Storage';
import { Config } from './Config';
import { CONFIG_FILE } from './BaseConfig';

export class Configurator {

    @Inject()
    filesystem: Storage;

    load(path: string): Config {
        const configList = new Config();

        if (!this.filesystem.exists(path)) {
            console.warn(`Config path '${path}' does not exist. Running with default config.`);
            return configList;
        }

        this.filesystem
            .files(path)
            .whereIn('extension', ['ts'])
            .forEach(file => {
                const configItem = require(file.path).default;
                if (configItem && configItem.constructor) {
                    const fileName = Reflect.getMetadata(CONFIG_FILE, configItem.constructor);
                    configList.set(fileName, configItem);
                }
            });
        return configList;
    }
}
