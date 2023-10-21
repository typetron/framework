import { Abstract, AnyFunction, Constructor, Type } from '../Support'
import { MiddlewareInterface } from './Middleware'
import { Guard } from './Guard'

export abstract class Route {
    parameters: Record<string, string> = {}
    guards: (typeof Guard)[] = []

    constructor(
        public name = '',
        public controller: Constructor,
        public controllerMethod: string,
        public parametersTypes: (Type<AnyFunction> | FunctionConstructor)[] = [],
        public middleware: Abstract<MiddlewareInterface>[] = []
    ) {
    }
}
