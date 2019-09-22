import { Constructor } from '../../Support';
import { Entity } from '../../Database/Entity';
import { Request } from '../../Http';
import { BaseResolver, Container } from '../../Container';
import { InjectableMetadata, Scope } from '../../Container/Metadata';

export class ModelResolver extends BaseResolver {

    constructor(container: Container) {
        super(container);
        const metadata: InjectableMetadata = Reflect.getMetadata(InjectableMetadata.KEY, Entity) || InjectableMetadata.DEFAULT();
        metadata.scope = Scope.REQUEST;
        Reflect.defineMetadata(InjectableMetadata.KEY, metadata, Entity);
    }

    canResolve<T>(abstract: Constructor<T>): boolean {
        return abstract.prototype instanceof Entity;
    }

    async resolve<T>(abstract: Constructor<Entity> & typeof Entity, parametersValues: object[]): Promise<T> {
        let model: Entity;
        const request = this.container.get(Request);
        const requestParameterName = abstract.name.toLowerCase();
        if (request.parameters[requestParameterName]) {
            model = await abstract.find(Number(request.parameters[requestParameterName]));
        } else {
            model = new abstract();
            model.fill(request.content || {});
        }

        // @ts-ignore
        return model;
    }
}
