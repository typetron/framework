import { Entity } from './Entity';

export interface ColumnInterface {

    value<T extends Entity, K extends keyof T>(model: T, value: T[K]): T[K] | string | number | undefined;
}

export class ColumnField implements ColumnInterface {
    constructor(public name: string, public type: Function, public column: string) {
    }

    value<T extends Entity, K extends keyof T>(model: T, value: T[K]): T[K] | string | number | undefined {
        return value;
    }
}

export class ManyToOneField extends ColumnField {
    constructor(name: string, type: Function, public inverseBy: string, column: string) {
        super(name, type, column);
    }

    value<T extends Entity, K extends keyof T>(model: T, value: T[K]) {
        if (!value) {
            return;
        }
        if (value instanceof Entity) {
            return value[value.getPrimaryKey()] as unknown as T[K];
        }
        throw new Error('Many to One: Invalid value');
    }
}

export class ManyToManyField extends ColumnField {
    constructor(name: string, type: Function, public inverseBy: string, joinTable: string, tableColumn: string, foreignColumn: string) {
        super(name, type, tableColumn);
    }

    value<T extends Entity, K extends keyof T>(model: T, value: T[K]) {
        if (!value) {
            return;
        }
        if (value instanceof Entity) {
            return value[value.getPrimaryKey()] as unknown as T[K];
        }
        throw new Error('Many to One: Invalid value');
    }
}

export class OneToManyField extends ColumnField {
    constructor(name: string, type: Function, public inverseBy: string, column: string) {
        super(name, type, column);
    }
}


