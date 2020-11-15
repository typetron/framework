import { MetadataKey } from '../Support/Metadata'
import { Abstract, Type } from '../Support'
import { MiddlewareInterface } from './Middleware'
import { Http } from '../Http'
import { Guard } from './Guard'

export class RouteMetadata {
    middleware: Abstract<MiddlewareInterface>[] = []
    parametersTypes: (Type<Function> | FunctionConstructor)[]
    path: string
    name: string
    method: Http.Method
    parametersOverrides: Function[] = []
    guards: typeof Guard[] = []
}

export class ControllerMetadata extends MetadataKey('framework:controller') {
    middleware: Abstract<MiddlewareInterface>[] = []
    routes: {[key: string]: RouteMetadata} = {}
    guards: typeof Guard[] = []
}
