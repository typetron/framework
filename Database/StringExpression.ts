import { Expression } from '@Typetron/Database/Expression'

export class StringExpression extends Expression {
    constructor(public value: string) {super()}

    toSQL() {
        return this.value
    }
}
