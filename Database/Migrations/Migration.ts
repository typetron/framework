import { Connection } from '../Connection'

export abstract class Migration {

    protected connection: Connection

    constructor(connection: Connection) {
        this.connection = connection
    }

    abstract up(): Promise<unknown>;

    abstract down(): Promise<unknown>;
}
