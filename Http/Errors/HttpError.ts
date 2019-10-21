import { Http } from '../index';

export class HttpError extends Error {

    constructor(public content: string | object, public status: Http.Status = Http.Status.BAD_REQUEST) {
        super('');
    }

    getMessage() {
        return this.content;
    }
}
