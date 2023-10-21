import { MetadataKey } from '../Support/Metadata'
import { Abstract, Type } from '../Support'
import { MiddlewareInterface } from './Middleware'
import { Http } from './Http'
import { Guard } from './Guard'
import { Container } from '@Typetron/Container'

export class MethodMetadata {
    middleware: Abstract<MiddlewareInterface>[] = []
    parametersTypes: (Type<(...args: any[]) => any> | FunctionConstructor)[]
    name: string
    parametersOverrides: ((container: Container) => any)[] = []
    guards: typeof Guard[] = []
}

export class ActionMetadata extends MethodMetadata {
}

export class RouteMetadata extends MethodMetadata {
    path: string
    method: Http.Method
}

export class ControllerOptions {
    prefix?: string
}

export class ControllerMetadata extends MetadataKey('framework:controller') {
    middleware: Abstract<MiddlewareInterface>[] = []
    routes: {[key: string]: RouteMetadata} = {}
    actions: {[key: string]: ActionMetadata} = {}
    methods: {[key: string]: MethodMetadata} = {}
    guards: typeof Guard[] = []
}
