import { Container } from '../Container';
import { Type } from '../Support';
import { Controller } from './Controller';
import { Request, Response } from '../Http';
import { InjectableMetadata } from '../Container/Metadata';

export class Route {
    parameters: {[key: string]: string} = {};
    private readonly uriParts: {name: string, type: 'part' | 'parameter'}[] = [];

    constructor(public uri: string,
        public method: string,
        public controller: typeof Controller,
        public action: string,
        public name = ''
    ) {
    }

    async run(request: Request, container: Container): Promise<Object | String | Response> {
        const controller = container.get(this.controller) as Controller;
        const action: Function = controller[this.action as keyof Controller];

        // console.log("step3 ->", Reflect.getMetadata("design:type", controller, action.name));
        // console.log("step4 ->", Reflect.getMetadata("design:paramtypes", controller, action.name));
        // console.log('step5 ->', Reflect.getMetadata('design:returntype', controller, action.name));
        const metadata = Reflect.getMetadata(InjectableMetadata.KEY, controller, action.name) || InjectableMetadata.DEFAULT();
        let parameters = Reflect.getMetadata('design:paramtypes', controller, action.name);
        parameters = await this.resolveParameters(parameters, metadata, container);
        return action.apply(controller, parameters);
    }

    matches(uri: string) {
        const uriParts = uri.split('/'); // ex: ['users', '1', 'posts'];
        let i;
        for (i = 0; i < uriParts.length; i++) {
            if (!this.uriParts[i]) {
                return false;
            }
            if (this.uriParts[i].type === 'parameter') {
                this.parameters[this.uriParts[i].name] = uriParts[i];
                continue;
            }

            if (this.uriParts[i].name !== uriParts[i]) {
                return false;
            }
        }

        if (i !== this.uriParts.length) {
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

    private resolveParameters(parameters: Type<Function>[], newValues: ((...args: object[]) => string | number) [], container: Container) {
        let parameterIndex = 0;
        const routeParameters = Object.values(this.parameters);
        return parameters.map((parameter, index) => {
            const newValueFunction = newValues[index];
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
