import { BaseResolver, ClassResolver, Container, InjectableMetadata, Scope } from '../../Container';
import { Constructor } from '../../Support';
import { Form, FormFields } from '../../Forms';
import { Http, HttpError, Request } from '../../Http';

export class FormResolver extends BaseResolver {

    constructor(container: Container) {
        super(container);
        this.setFormScopeToRequest();
    }

    resolve<T>(abstract: Constructor<T & Form>, parameters: object[]): T {
        const request = this.container.get(Request);
        const classResolver = new ClassResolver(this.container);
        const form = classResolver.resolve(abstract, parameters);
        form.fill({...request.content as object, ...request.files} as FormFields<Form>);

        if (!form.valid()) {
            throw new HttpError(form.errors, Http.Status.UNPROCESSABLE_ENTITY);
        }

        return form;
    }

    canResolve<T>(abstract: Constructor<T>): boolean {
        return abstract.prototype instanceof Form;
    }

    private setFormScopeToRequest() {
        const metadata = InjectableMetadata.get(Form);

        metadata.scope = Scope.REQUEST;
        InjectableMetadata.set(metadata, Form);
    }
}
