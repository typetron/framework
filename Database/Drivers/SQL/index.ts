export interface ColumnDefinitionOptions {
    name: string
    type: string
    nullable?: boolean
    default?: string | number
    autoIncrement?: number
    primaryKey?: boolean
}
