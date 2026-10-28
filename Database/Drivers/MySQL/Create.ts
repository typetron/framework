import { Create as BaseCreate } from '../SQL/Create'
import { ColumnDefinition } from './ColumnDefinition'

export class Create extends BaseCreate {
    protected columnDefinition = ColumnDefinition
}
