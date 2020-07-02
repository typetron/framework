import { Connection } from '../Database/Connection';

export class Migration {

    protected connection: Connection;
    constructor(connection: Connection) {
        this.connection = connection;
    }

    public async up(): Promise<unknown> {
        return Promise.resolve(() => { });
    }

    public async down(): Promise<unknown> {
        return Promise.resolve(() => { });
    }
}
