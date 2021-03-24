import { Components, SqlValue } from '@Typetron/Database/Types'

export abstract class Statement {
    bindings: SqlValue[] = []

    constructor(public components: Components) {
    }

    abstract toSql(): string;

    toString() {
        return this.toSql()
    }
}
