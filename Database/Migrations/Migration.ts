import { Connection } from '../Connection'

export abstract class Migration {

    constructor(protected connection: Connection) {}

    abstract up(): void | Promise<void>;

    abstract down(): void | Promise<void>;
}
