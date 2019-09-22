import { Constructor } from '../../Support';
import { CONFIG_FILE } from './BaseConfig';

export class Config {

    constructor(public configList = new Map<string, object>()) {
    }

    get<T extends Constructor>(config: T): InstanceType<T> {
        const file = Reflect.getMetadata(CONFIG_FILE, config);
        return this.configList.get(file) as InstanceType<T>;
    }

    set(key: string, config: object) {
        return this.configList.set(key, config);
    }
}
