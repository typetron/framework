import { BaseConfig } from './BaseConfig';
import { MiddlewareInterface } from '../../Router';
import { Abstract, Type } from '../../Support';
import { Provider } from '../Provider';

export class AppConfig extends BaseConfig<AppConfig>('app') {
    environment: string;
    port: number;
    middleware: Abstract<MiddlewareInterface>[];
    providers: Type<Provider> [];
    staticAssets?: {[key: string]: string | string[]};
}
