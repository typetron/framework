import { Container, Inject } from '../Container';

export class BaseController {

    @Inject()
    protected app: Container;
}
