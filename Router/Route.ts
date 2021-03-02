import { Container } from '../Container'
import { Abstract, Constructor, Type } from '../Support'
import { Request, Response } from '../Web'
import { MiddlewareInterface } from './Middleware'
import { ControllerMetadata } from './Metadata'
import { Guard } from './Guard'

export class Route {
    parameters: {[key: string]: string} = {}
    guards: (typeof Guard)[] = []

    private readonly uriParts: {name: string, type: 'part' | 'parameter'}[] = []

    constructor(public uri: string,
        public method: string,
        public controller: Constructor,
        public action: string,
        public name = '',
        public parametersTypes: (Type<Function> | FunctionConstructor)[] = [],
        public middleware: Abstract<MiddlewareInterface>[] = []
    ) {
        this.splitUriParts()
    }

    async run(request: Request, container: Container): Promise<object | string | Response> {
        const controller = await container.get(this.controller)

        try {
            const metadata = ControllerMetadata.get(this.controller).routes[this.action]
            const parameters = await this.resolveParameters(metadata.parametersTypes, metadata.parametersOverrides, container)

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

    matches(uri: string) {
        const uriParts = uri.split('/') // ex: ['users', '1', 'posts'];
        let part
        let parameterTypeIndex = 0
        for (part = 0; part < uriParts.length; part++) {
            if (!this.uriParts[part]) {
                return false
            }
            if (this.uriParts[part].type === 'parameter' && this.hasCorrectPrimitiveType(parameterTypeIndex, uriParts[part])) {
                parameterTypeIndex++
                this.parameters[this.uriParts[part].name] = uriParts[part]
                continue
            }

            if (this.uriParts[part].name !== uriParts[part]) {
                return false
            }
        }

        if (part !== this.uriParts.length) {
            return false
        }
        return true
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

    getUrl(): string {
        return this.uriParts.map(part => {
            if (part.type === 'parameter') {
                return this.parameters[part.name]
            }
            return part.name
        }).join('/')
    }

    private async resolveParameters(parameters: Type<Function>[], overrides: Function[], container: Container) {
        let parameterIndex = 0
        const routeParameters = Object.values(this.parameters)
        return parameters.mapAsync(async (parameter, index) => {
            const newValueFunction = overrides[index]
            if (newValueFunction) {
                return await newValueFunction.call(undefined, container.get(Request), container)
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

    private hasCorrectPrimitiveType(parameterTypeIndex: number, uriPart: string) {
        const parameterType = this.parametersTypes[parameterTypeIndex]
        return (primitiveTypes[parameterType.name] || (value => value))(uriPart)
    }
}

const primitiveTypes: Record<string, (value: string) => boolean> = {
    Number: (value: string) => !isNaN(Number(value)),
}
