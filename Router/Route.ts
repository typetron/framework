import { Container } from '../Container';
import { Abstract, Constructor, Type } from '../Support';
import { Request, Response } from '../Http';
import { MiddlewareInterface } from './Middleware';
import { ControllerMetadata } from './Metadata';
import { Guard } from './Guard';

export class Route {
    parameters: {[key: string]: string} = {};
    guards: Type<Guard>[] = [];

    private readonly uriParts: {name: string, type: 'part' | 'parameter'}[] = [];

    constructor(public uri: string,
        public method: string,
        public controller: Constructor,
        public action: string,
        public name = '',
        public middleware: Abstract<MiddlewareInterface>[] = []
    ) {
        this.setUriParts();
    }

    async run(request: Request, container: Container): Promise<object | string | Response> {
        const controller = container.get(this.controller);

        try {
            const metadata = ControllerMetadata.get(this.controller).routes[this.action];
            const parameters = await this.resolveParameters(metadata.parametersTypes, metadata.parametersOverrides, container);

            for await (const guardClass of this.guards) {
                const guard = container.get(guardClass);
                if (!await guard.condition(...parameters)) {
                    guard.onFail();
                }
            }

            return (controller[this.action as keyof Constructor] as Function).apply(controller, parameters);
        } catch (error) {
            error.stack = `Controller: ${controller.constructor.name}.${this.action} \n at ` + error.stack;
            throw error;
        }
    }

    matches(uri: string) {
        const uriParts = uri.split('/'); // ex: ['users', '1', 'posts'];
        let part;
        for (part = 0; part < uriParts.length; part++) {
            if (!this.uriParts[part]) {
                return false;
            }
            if (this.uriParts[part].type === 'parameter' && uriParts[part]) {
                this.parameters[this.uriParts[part].name] = uriParts[part];
                continue;
            }

            if (this.uriParts[part].name !== uriParts[part]) {
                return false;
            }
        }

        if (part !== this.uriParts.length) {
            return false;
        }
        return true;
    }

    setUriParts() {
        this.uri.split('/').forEach(uriPart => {
            const matches = uriPart.match(/{(\w+)}/);
            if (matches) {
                this.uriParts.push({
                    name: matches[1],
                    type: 'parameter'
                });
            } else {
                this.uriParts.push({
                    name: uriPart,
                    type: 'part'
                });
            }
        });
    }

    private async resolveParameters(parameters: Type<Function>[], overrides: Function[], container: Container) {
        let parameterIndex = 0;
        const routeParameters = Object.values(this.parameters);
        return parameters.mapAsync(async (parameter, index) => {
            const newValueFunction = overrides[index];
            if (newValueFunction) {
                return newValueFunction.call(undefined, container.get(Request));
            }
            if (parameter.name === 'String') {
                return routeParameters[parameterIndex++];
            }
            if (parameter.name === 'Number') {
                return Number(routeParameters[parameterIndex++]);
            }
            return container.get(parameter);
        });
    }

}
