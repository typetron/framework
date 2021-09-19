import { MetadataKey } from '../Support/Metadata'
import { Abstract, Type } from '../Support'
import { MiddlewareInterface } from './Middleware'
import { Http } from './Http'
import { Guard } from './Guard'

export class EventMetadata {
    middleware: Abstract<MiddlewareInterface>[] = []
    parametersTypes: (Type<Function> | FunctionConstructor)[]
    name: string
    parametersOverrides: Function[] = []
    guards: typeof Guard[] = []
}

export class RouteMetadata extends EventMetadata {
    path: string
    method: Http.Method
}

export class ControllerMetadata extends MetadataKey('framework:controller') {
    middleware: Abstract<MiddlewareInterface>[] = []
    routes: {[key: string]: RouteMetadata} = {}
    events: {[key: string]: EventMetadata} = {}
    guards: typeof Guard[] = []
}
