import { BaseConfig } from './Config/BaseConfig';

export class ResourcesConfig extends BaseConfig<ResourcesConfig>('resources') {
    public: string[];
}
