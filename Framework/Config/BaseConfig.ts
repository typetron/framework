export const CONFIG_FILE = 'CONFIG_FILE';

export function BaseConfig<T>(file: string) {
    const baseConfigClass = class {
        constructor(values: { [K in keyof T]?: T[K] }) {
            Object.assign(this, values);
        }
    };

    Reflect.defineMetadata(CONFIG_FILE, file, baseConfigClass);
    return baseConfigClass;
}
