import { ColumnDefinitionOptions } from '../../Drivers/SQL'
import { wrap } from '../../Helpers'

export class ColumnDefinition {
    constructor(public options: ColumnDefinitionOptions) {}

    toSQL() {
        const sqlParts = [wrap(this.options.name), this.options.type]

        if (this.options.autoIncrement) {
            sqlParts.push('AUTO_INCREMENT')
        }

        return sqlParts.join(' ')
    }
}
