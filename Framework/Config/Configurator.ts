import { Inject } from '../../Container';
import { Filesystem } from '../../Filesystem';
import { Config } from './Config';
import { CONFIG_FILE } from './BaseConfig';

export class Configurator {

    @Inject()
    filesystem: Filesystem;

    load(path: string): Config {
        const configList = new Config();
        this.filesystem
            .files(path)
            .whereIn('extension', ['ts'])
            .forEach(file => {
                const configItem = require(file.fullPath).default;
                if (configItem && configItem.constructor) {
                    const fileName = Reflect.getMetadata(CONFIG_FILE, configItem.constructor);
                    configList.set(fileName, configItem);
                }
            });
        return configList;
    }
}
