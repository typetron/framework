import { Container, Inject } from '../Container';

export class Controller {

    @Inject()
    protected app: Container;
}
