import { Container, Inject } from '@Typetron/Container'

export abstract class Provider {

    @Inject()
    public app: Container

    abstract register(): void | Promise<void>;
}
