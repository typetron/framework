import { Application } from './Application';
import { Constructor } from '../Support';

export abstract class Provider {
    protected app: Application;

    abstract register(): void | Promise<void>;

    get(service: Constructor) {
        this.app.get(service);
    }

    setApplication(application: Application) {
        this.app = application;
    }
}
