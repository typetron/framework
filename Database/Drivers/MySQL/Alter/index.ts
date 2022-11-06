import { ColumnDefinitionOptions } from '../../../Drivers/SQL'
import { wrap } from '../../../Helpers'
import { ColumnDefinition } from '@Typetron/Database/Drivers/MySQL/ColumnDefinition'
import { Expression } from '@Typetron/Database'

export enum Constraints {
    PrimaryKey = 'PRIMARY KEY',
    ForeignKey = 'FOREIGN KEY',
}

export abstract class AlterOption extends Expression {
    constructor(public column: ColumnDefinitionOptions) {super()}

    abstract toSQL(): string
}

export class AddColumn extends AlterOption {
    toSQL(): string {
        return `ADD ${new ColumnDefinition(this.column).toSQL()}`
    }
}

export class AddConstraint extends AlterOption {

    constructor(column: ColumnDefinitionOptions, public type: Constraints) {super(column)}

    toSQL(): string {
        return `ADD CONSTRAINT ${this.type} (${this.column.name})`
    }
}

export class ModifyColumn extends AlterOption {
    toSQL(): string {
        return `MODIFY ${new ColumnDefinition(this.column).toSQL()}`
    }
}

export class DropColumn extends Expression {
    constructor(public column: string) {super()}

    toSQL(): string {
        return `DROP COLUMN ${wrap(this.column)}`
    }
}

export class Alter extends Expression {
    constructor(public table: string, public alterOptions: Expression[]) {super()}

    toSQL() {
        return `
            ALTER TABLE ${wrap(this.table)}
                ${this.alterOptions.map(option => option.toSQL()).join(', \n')}
        `
    }
}
