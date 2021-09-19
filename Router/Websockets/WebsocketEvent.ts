import { Container } from '../../Container'
import { Abstract, Constructor, Type } from '../../Support'
import { MiddlewareInterface } from '../Middleware'
import { ControllerMetadata, EventMetadata } from '../Metadata'
import { Guard } from '../Guard'

export class WebsocketEvent {
    guards: (typeof Guard)[] = []

    constructor(
        public name = '',
        public controller: Constructor,
        public action: string,
        public parametersTypes: (Type<Function> | FunctionConstructor)[] = [],
        public middleware: Abstract<MiddlewareInterface>[] = []
    ) {}

    async run(container: Container, requestParameters: Record<string, unknown>): Promise<object | string> {
        const controller = await container.get(this.controller)

        try {
            const metadata: EventMetadata | undefined = ControllerMetadata.get(this.controller).events[this.action]
            const parameters = await this.resolveParameters(
                requestParameters,
                this.parametersTypes,
                metadata?.parametersOverrides ?? [],
                container
            )

            for await (const guardClass of this.guards) {
                const guard = container.get(guardClass)
                if (!await guard.condition(...parameters)) {
                    guard.onFail()
                }
            }

            return (controller[this.action as keyof Constructor] as Function).apply(controller, parameters)
        } catch (error) {
            error.stack = `Controller: ${controller.constructor.name}.${this.action} \n at ` + error.stack
            throw error
        }
    }

    private async resolveParameters(
        requestParameters: Record<string, unknown>,
        parametersTypes: Type<Function>[],
        overrides: Function[],
        container: Container
    ) {
        let parameterIndex = 0
        // tslint:disable-next-line:no-any
        const routeParameters: any[] = Object.values(requestParameters)
        return parametersTypes.mapAsync(async (parameter, index) => {
            const newValueFunction = overrides[index]
            if (newValueFunction) {
                return await newValueFunction.call(undefined, container)
            }
            if (parameter.name === 'String') {
                return routeParameters[parameterIndex++]
            }
            if (parameter.name === 'Number') {
                const value = routeParameters[parameterIndex++]
                return value === undefined || value === 'undefined' ? undefined : Number(value)
            }
            return container.get(parameter, [routeParameters[parameterIndex]])
        })
    }

}

