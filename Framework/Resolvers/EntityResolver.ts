import { Constructor } from '../../Support';
import { Entity, EntityConstructor } from '../../Database';
import { Request } from '../../Http';
import { BaseResolver, Container, InjectableMetadata, Scope } from '../../Container';

export class EntityResolver extends BaseResolver {

    constructor(container: Container) {
        super(container);
        this.setEntityScopeToRequest();
    }

    async resolve<T>(abstract: EntityConstructor<Entity> & typeof Entity, parametersValues: object[]): Promise<T> {
        let entity: Entity;
        const request = this.container.get(Request);
        const requestParameterName = abstract.name.toLowerCase();
        const parameter = request.parameters[requestParameterName];
        if (parameter) {
            entity = await abstract.find(Number(parameter));
        }

        // @ts-ignore
        return entity;
    }

    canResolve<T>(abstract: Constructor<T>): boolean {
        return abstract.prototype instanceof Entity;
    }

    private setEntityScopeToRequest() {
        const metadata = InjectableMetadata.get(Entity);
        metadata.scope = Scope.REQUEST;
        InjectableMetadata.set(metadata, Entity);
    }
}
