export class Expression {
    constructor(public value: string) {}

    toSQL() {
        return this.value
    }
}
