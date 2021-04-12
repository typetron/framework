import { Application } from './Application'
import { Inject } from '@Typetron/Container'

export abstract class Provider {

    @Inject()
    public app: Application

    abstract register(): void | Promise<void>;
}
