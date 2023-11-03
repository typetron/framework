import { Abstract, AnyFunction, Constructor, Type } from '../Support'
import { GlobalMiddleware } from './Middleware'
import { Guard } from './Guard'

export abstract class Route {
    guards: (typeof Guard)[] = []

    constructor(
        public name = '',
        public controller: Constructor,
        public controllerMethod: string,
        public parametersTypes: (Type<AnyFunction> | FunctionConstructor)[] = [],
        public middleware: Abstract<GlobalMiddleware>[] = []
    ) {
    }
}
