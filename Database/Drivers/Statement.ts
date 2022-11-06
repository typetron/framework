import { Components, SqlValue } from '../Types'
import { StringExpression } from '../StringExpression'

export abstract class Statement extends StringExpression {
    bindings: SqlValue[] = []

    constructor(public components: Components) {
        super('')
    }

    abstract toSQL(): string;

    toString() {
        return this.toSQL()
    }
}
