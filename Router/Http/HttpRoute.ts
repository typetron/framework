import { Container } from '../../Container'
import { Abstract, Constructor, Type } from '../../Support'
import { ControllerMetadata } from './../Metadata'
import { Route } from '@Typetron/Router'
import { AnyFunction } from '@Typetron/Support'
import { HttpMiddleware } from '@Typetron/Router/Http/Middleware'

export class HttpRoute extends Route {

    public readonly uriParts: {name: string, type: 'part' | 'parameter'}[] = []

    constructor(
        public uri: string,
        public method: string,
        public name = '',
        public controller: Constructor,
        public controllerMethod: string,
        public parametersTypes: (Type<AnyFunction> | FunctionConstructor)[] = [],
        public middleware: Abstract<HttpMiddleware>[] = []
    ) {
        super(name, controller, controllerMethod, parametersTypes, middleware)
        this.splitUriParts()
    }

    async run(container: Container, requestParameters: Record<string, string | number>): Promise<object | string> {
        const controller = await container.get(this.controller)

        try {
            const metadata = ControllerMetadata.get(this.controller).routes[this.controllerMethod]
            const parameters = await this.resolveParameters(
                requestParameters,
                metadata.parametersTypes,
                metadata.parametersOverrides,
                container
            )

            for await (const guardClass of this.guards) {
                const guard = container.get(guardClass)
                if (!await guard.condition(...parameters)) {
                    guard.onFail()
                }
            }

            return (controller[this.controllerMethod as keyof Constructor] as AnyFunction<object | string>).apply(controller, parameters)
        } catch (unknownError) {
            const error = unknownError as Error
            error.stack = `Controller: ${controller.constructor.name}.${this.controllerMethod} \n at ` + error.stack
            throw error
        }
    }

    splitUriParts() {
        this.uri.split('/').forEach(uriPart => {
            const matches = uriPart.match(/:(\w+)/)
            if (matches) {
                this.uriParts.push({
                    name: matches[1],
                    type: 'parameter'
                })
            } else {
                this.uriParts.push({
                    name: uriPart,
                    type: 'part'
                })
            }
        })
    }

    getUrl(parameters: Record<string, string>): string {
        return this.uriParts.map(part => {
            if (part.type === 'parameter') {
                return parameters[part.name]
            }
            return part.name
        }).filter(Boolean).join('/')
    }

    hasCorrectPrimitiveType(parameterTypeIndex: number, uriPart: string) {
        const parameterType = this.parametersTypes[parameterTypeIndex]
        return (primitiveTypes[parameterType.name] || (value => value))(uriPart)
    }

    private async resolveParameters(
        requestParameters: Record<string, string | number>,
        parameters: (Type<(...args: any[]) => any> | FunctionConstructor)[],
        overrides: ((container: Container) => unknown)[],
        container: Container
    ) {
        let parameterIndex = 0
        const routeParameters = Object.values(requestParameters)
        return parameters.mapAsync(async (parameter, index) => {
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
            return container.get(parameter)
        })
    }
}

const primitiveTypes: Record<string, (value: string) => boolean> = {
    Number: (value: string) => !isNaN(Number(value)),
}
