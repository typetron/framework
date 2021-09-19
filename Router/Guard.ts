import { Http, HttpError } from './Http'

export abstract class Guard {
    // tslint:disable-next-line:no-any
    abstract condition(...args: any[]): Promise<boolean>;

    onFail(): void {
        throw new HttpError('Unauthorized', Http.Status.UNAUTHORIZED)
    }
}
