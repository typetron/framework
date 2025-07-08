import { Container } from '../../Container'
import { AnyFunction, Constructor, Type } from '../../Support'
import { ControllerMetadata, MethodMetadata } from '../Metadata'
import { Route } from '@Typetron/Router'

export class WebsocketRoute extends Route {

    async run(container: Container, requestParameters: Record<string, unknown>): Promise<object | string> {
        const controller = await container.get(this.controller)

        try {
            const metadata: MethodMetadata | undefined = ControllerMetadata.get(this.controller).actions[this.controllerMethod]
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

            return (controller[this.controllerMethod as keyof Constructor] as AnyFunction).apply(controller, parameters)
        } catch (unknownError) {
            const error = unknownError as Error
            error.stack = `Controller: ${controller.constructor.name}.${this.controllerMethod} \n at ` + error.stack
            throw error
        }
    }

    private async resolveParameters(
        requestParameters: Record<string, unknown>,
        parametersTypes: (Type<AnyFunction> | FunctionConstructor)[],
        overrides: AnyFunction[],
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
            return container.get(parameter, [routeParameters[parameterIndex++]])
        })
    }

}

