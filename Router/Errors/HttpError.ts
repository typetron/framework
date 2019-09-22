import { Http } from '../../Http';

export class HttpError extends Error {

    constructor(public httpMessage: string | object, public status: Http.Status = Http.Status.BAD_REQUEST) {
        super('');
    }

    getMessage() {
        return this.httpMessage;
    }
}
