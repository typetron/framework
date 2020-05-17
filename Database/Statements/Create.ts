import { ColumnField } from '../Fields';
import { Entity } from '../Entity';

export class Create {

    table: string;
    columns: ColumnField<Entity>[] = [];

    constructor() {}

    getColumns() {
        return '';
    }

    toSql() {
        return `
            CREATE
            TABLE
            ${this.table}
            (
                ${this.getColumns()}
            )
        `;
    }
}
