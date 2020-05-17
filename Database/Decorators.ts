import { KeysOfType, Constructor } from '../Support';
import { Entity } from './Entity';
import { ColumnField, ManyToManyField, ManyToOneField, OneToManyField } from './Fields';
import { EntityConstructor } from './index';

export const EntityMetadataKey = 'framework:entity';

export class EntityOptions<T> {
    table?: string;
    touch?: KeysOfType<T, Entity | Entity[]>[];
}

export class EntityMetadata<T = {}> extends EntityOptions<T> {
    columns: Record<string, ColumnField<Entity>> = {};
    createdAtColumn?: string;
    updatedAtColumn?: string;

    static get(parent: Entity) {
        const entityMetadata = new this();
        const metadata: EntityMetadata<Entity> = Reflect.getMetadata(EntityMetadataKey, parent);
        return Object.assign(entityMetadata, metadata);
    }
}

export function Meta<T extends Entity>(options: EntityOptions<T> = {}) {
    return (entity: typeof Entity) => {
        const metadata = EntityMetadata.get(entity.prototype);
        options.table = options.table || entity.name.toLowerCase();
        Object.assign(metadata, options);
        Reflect.defineMetadata(EntityMetadataKey, metadata, entity.prototype);
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
        const field = new ColumnField(parent.constructor as EntityConstructor<T>, name, () => type, column || name);
        setEntityMetadata(parent, field);
    };
}

export function CreatedAt<T extends Entity>(column?: string) {
    return function (parent: T, name: string) {
        Column(column)(parent, name);
        const entityMetadata = EntityMetadata.get(parent);
        entityMetadata.createdAtColumn = column || name;
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, parent);
    };
}

export function UpdatedAt<T extends Entity>(column?: string) {
    return function (parent: T, name: string) {
        Column(column)(parent, name);
        const entityMetadata = EntityMetadata.get(parent);
        entityMetadata.updatedAtColumn = column || name;
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, parent);
    };
}

export class ID extends Number {}

export function OneToMany<T extends Entity, R extends Entity>(
    type: () => EntityConstructor<R>,
    inverseBy: KeysOfType<R, Entity>,
    column?: string
) {
    return function (parent: T, property: string) {
        const field = new OneToManyField(parent.constructor as EntityConstructor<Entity>, property, type, inverseBy as string);
        setEntityMetadata(parent, field);
    };
}

export function ManyToOne<T extends Entity, R extends Entity>(
    type: () => EntityConstructor<R>,
    inverseBy: KeysOfType<R, Entity[]>,
    column?: string
) {
    return function (parent: T, property: string) {
        const parentConstructor = parent.constructor as EntityConstructor<T>;
        column = column || property + (parentConstructor.getPrimaryKey() as string).capitalize();
        const field = new ManyToOneField(parentConstructor, property, type, inverseBy as string, column);
        setEntityMetadata(parent, field);
        // TODO refactor needed. This is used when setting the value of the relation to an entity instance. It will get
        // only the foreign key value instead of passing the entire object, which cannot be save in the database.
        // const entityMetadata = EntityMetadata.get(parent);
        // entityMetadata.columns[column] = field;
        // Reflect.defineMetadata(EntityMetadataKey, entityMetadata, parent);
    };
}

export function ManyToMany<T extends Entity, R extends Entity>(
    type: () => EntityConstructor<R>,
    inverseBy: KeysOfType<R, Entity[]>,
    joinTable?: string,
    tableColumn?: string,
    foreignColumn?: string
) {
    return function (parent: T, name: string) {
        const parentConstructor = parent.constructor as EntityConstructor<T>;
        const field = new ManyToManyField<T, R>(parentConstructor, name, type, inverseBy as string, joinTable, tableColumn, foreignColumn);
        setEntityMetadata(parent, field);
    };
}

