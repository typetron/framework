import { AddColumn as BaseAddColumn, AlterOption } from '../../SQL/Alter'
import { ColumnDefinition } from '../ColumnDefinition'

export { AddConstraint, Alter, AlterOption, Constraints, DropColumn } from '../../SQL/Alter'

export class AddColumn extends BaseAddColumn {
    protected columnDefinition = ColumnDefinition
}

export class ModifyColumn extends AlterOption {
    toSQL(): string {
        return `MODIFY ${new ColumnDefinition(this.column).toSQL()}`
    }
}
