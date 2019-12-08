import { KeysOfType } from '../Support';
import { Entity } from './Entity';
import { ColumnField, ManyToManyField, ManyToOneField, OneToManyField } from './Fields';
import { EntityConstructor } from './index';

export const EntityMetadataKey = 'framework:entity';

export class EntityOptions<T> {
    timestamps?: boolean;
    table?: string;
    touch?: KeysOfType<T, Entity | Entity[]>[];
}

// export interface EntityMetadata<T = {}> extends EntityOptions<T> {
//     columns?: { [key: string]: ColumnField };
// }

// const defaultMetadata: EntityMetadata = {
//     columns: {}
// };

export class EntityMetadata<T = {}> extends EntityOptions<T> {
    columns: {[key: string]: ColumnField<Entity>} = {};

    static get(parent: Entity) {
        const entityMetadata = new this();
        const metadata: EntityMetadata<Entity> = Reflect.getMetadata(EntityMetadataKey, parent);
        return Object.assign(entityMetadata, metadata);
    }
}

export function Meta<T extends Entity>(options: EntityOptions<T> = {}) {
    return (parent: typeof Entity) => {
        let metadata = EntityMetadata.get(parent.prototype);
        metadata = Object.assign(metadata, options);
        Reflect.defineMetadata(EntityMetadataKey, metadata, parent.prototype);
    };
}

function setEntityMetadata(parent: Entity, field: ColumnField<Entity>) {
    const entityMetadata = EntityMetadata.get(parent);
    entityMetadata.columns[field.property] = field;
    Reflect.defineMetadata(EntityMetadataKey, entityMetadata, parent);
}

export function Column<T extends Entity>(column?: string) {
    return function (parent: T, name: string) {
        const type = Reflect.getMetadata('design:type', parent, name);
        const field = new ColumnField(parent.constructor as EntityConstructor<T>, name, type, column || name);
        setEntityMetadata(parent, field);
    };
}

export type ID = number;

export function OneToMany<T extends Entity, R extends Entity>(type: () => EntityConstructor<R>, inverseBy: KeysOfType<R, Entity>, column?: string) {
    return function (parent: T, property: string) {
        const field = new OneToManyField(parent.constructor as EntityConstructor<Entity>, property, type, inverseBy as string);
        setEntityMetadata(parent, field);
    };
}

export function ManyToOne<T extends Entity, R extends Entity>(type: () => EntityConstructor<R>, inverseBy: KeysOfType<R, Entity[]>, column?: string) {
    return function (parent: T, property: string) {
        const parentConstructor = parent.constructor as EntityConstructor<T>;
        column = column || property + (parentConstructor.getPrimaryKey() as string).capitalize();
        const field = new ManyToOneField(parentConstructor, property, type, inverseBy as string, column);
        setEntityMetadata(parent, field);
    };
}

export function ManyToMany<T extends Entity, R extends Entity>(type: () => EntityConstructor<R>, inverseBy: KeysOfType<R, Entity[]>, joinTable?: string, tableColumn?: string, foreignColumn?: string) {
    return function (parent: T, name: string) {
        const parentConstructor = parent.constructor as EntityConstructor<T>;
        const field = new ManyToManyField<T, R>(parentConstructor, name, type, inverseBy as string, joinTable, tableColumn, foreignColumn);
        setEntityMetadata(parent, field);
    };
}

