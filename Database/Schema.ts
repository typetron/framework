import { Entity } from './Entity';

export class Schema {
    constructor(public model: typeof Entity) {
    }

    toSql() {
        return 'CREATE TABLE test()';
    }
}
