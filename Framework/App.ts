import { Application } from './Application';
import { ServiceIdentifier } from '../Container/Contracts';

export class App {
    static instance: Application;

    static get<T>(service: ServiceIdentifier<T> | string): T {
        return App.instance.get(service);
    }
}
