import { Abstract, Type } from '../Support';
import { Middleware } from '../Router';
import { Provider } from './Provider';
import { BaseConfig } from './Config/BaseConfig';

export class AppConfig extends BaseConfig<AppConfig>('app') {
    port: number;
    middleware: Abstract<Middleware>[];
    providers: Type<Provider> [];
}
