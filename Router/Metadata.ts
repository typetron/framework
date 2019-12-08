import { MetadataKey } from '../Support/Metadata';
import { Abstract, Type } from '../Support';
import { MiddlewareInterface } from './Middleware';
import { Http } from '../Http';

export class RouteMetadata {
    middleware: Abstract<MiddlewareInterface>[] = [];
    parametersTypes: Type<Function>[];
    path: string;
    name: string;
    method: Http.Method;
    parametersOverrides: Function[] = [];
}

export class ControllerMetadata extends MetadataKey('framework:controller') {
    middleware: Abstract<MiddlewareInterface>[] = [];
    routes: {[key: string]: RouteMetadata} = {};
}
