import { Constructor } from '../../Support'
import { Entity, EntityConstructor } from '../../Database'
import { Request } from '../../Router/Request'
import { BaseResolver, Container, InjectableMetadata, Scope } from '../../Container'
import { EntityNotFoundError } from '../../Database/EntityNotFoundError'

export class EntityResolver extends BaseResolver {

    constructor(container: Container) {
        super(container)
        this.setEntityScopeToRequest()
    }

    async resolve<T>(abstract: EntityConstructor<Entity> & typeof Entity, parametersValues: object[]): Promise<T> {
        let entity: Entity | undefined
        const request = this.container.get(Request)
        const requestParameterName = abstract.name
        const parameter = request.parameters[requestParameterName] ?? Number(parametersValues[0])
        if (parameter) {
            entity = await abstract.find(parameter)
            if (!entity) {
                throw new EntityNotFoundError(abstract, `Entity '${requestParameterName}' with ${abstract.getPrimaryKey()} '${parameter}' not found`)
            }
        } else {
            throw new Error(`No parameter found that can be used as an entity identifier for the '${requestParameterName}' entity. Did you forget to add the '{${requestParameterName}}' parameter on the route?`)
        }

        // @ts-ignore
        return entity
    }

    canResolve<T>(abstract: Constructor<T>): boolean {
        return abstract.prototype instanceof Entity
    }

    private setEntityScopeToRequest() {
        const metadata = InjectableMetadata.get(Entity)
        metadata.scope = Scope.TRANSIENT
        InjectableMetadata.set(metadata, Entity)
    }
}
