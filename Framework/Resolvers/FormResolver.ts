import { BaseResolver } from '../../Container';
import { Constructor } from '../../Support';
import { Form } from '../../Forms';
import { Http, Request } from '../../Http';
import { HttpError } from '../../Router';

export class FormResolver extends BaseResolver {

    canResolve<T>(abstract: Constructor<T>): boolean {
        return abstract.prototype instanceof Form;
    }

    // tslint:disable-next-line:no-any
    resolve<T>(abstract: Constructor<T & Form<any>>, parameters: object[]): T {
        const request = this.container.get(Request);
        const form = new abstract(request.content);

        if (!form.valid()) {
            throw new HttpError(form.errors, Http.Status.UNPROCESSABLE_ENTITY);
        }

        return form;
    }
}
