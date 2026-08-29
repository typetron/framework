import { Request as BaseRequest } from '@Typetron/Router/Request'

export class Request extends BaseRequest {
    constructor(name: string, body?: string | object, public id?: string) {
        super(name, body)
    }
}
