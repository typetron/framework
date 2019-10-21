import { Abstract, Type } from '../Support';
import { MiddlewareInterface } from '../Router';
import { Provider } from './Provider';
import { BaseConfig } from './Config/BaseConfig';

export class AppConfig extends BaseConfig<AppConfig>('app') {
    environment: string;
    port: number;
    middleware: Abstract<MiddlewareInterface>[];
    providers: Type<Provider> [];
    staticAssets?: {[key: string]: string | string[]};
}
