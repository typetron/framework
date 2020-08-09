import { KeysOfType } from '../Support';
import { Entity } from './Entity';
import { BelongsTo, BelongsToMany, ColumnField, HasMany, HasOne, InverseRelationship, PrimaryField, RelationshipField } from './Fields';
import { EntityConstructor } from './index';
import { List } from './List';

export const EntityMetadataKey = 'framework:entity';

export type ID = number;

export class EntityOptions<T extends Entity> {
    table?: string;
    touch?: KeysOfType<T, Entity | List<T, Entity>>[];
}

export class EntityMetadata<T extends Entity> extends EntityOptions<T> {
    columns: Record<string, ColumnField<T>> = {};
    relationships: Record<string, RelationshipField<T, Entity>> = {};
    inverseRelationships: Record<string, InverseRelationship<T, Entity>> = {};
    createdAtColumn?: string;
    updatedAtColumn?: string;

    get allRelationships() {
        return {...this.relationships, ...this.inverseRelationships};
    }

    static get<T extends Entity>(entity: T) {
        const metadata: EntityMetadata<T> = Reflect.getMetadata(EntityMetadataKey, entity) || new this();
        metadata.table = metadata?.table || entity.constructor.name.toLowerCase();
        return metadata;
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

function setField<T extends Entity>(entity: T, field: ColumnField<T>) {
    const entityMetadata = EntityMetadata.get(entity);
    entityMetadata.columns[field.property] = field;
    Reflect.defineMetadata(EntityMetadataKey, entityMetadata, entity);
}

export function Column<T extends Entity>(column?: string) {
    return function (entity: T, name: string) {
        const type = Reflect.getMetadata('design:type', entity, name);
        const field = new ColumnField(entity.constructor as EntityConstructor<T>, name, () => type, column || name);
        setField(entity, field);
    };
}

export function PrimaryColumn<T extends Entity>(column?: string) {
    return function (entity: T, name: string) {
        const type = Reflect.getMetadata('design:type', entity, name);
        const field = new PrimaryField(entity.constructor as EntityConstructor<T>, name, () => type, column || name);
        setField(entity, field);
    };
}

export function CreatedAt<T extends Entity>(column?: string) {
    return function (entity: T, name: string) {
        Column(column)(entity, name);
        const entityMetadata = EntityMetadata.get(entity);
        entityMetadata.createdAtColumn = column || name;
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, entity);
    };
}

export function UpdatedAt<T extends Entity>(column?: string) {
    return function (entity: T, name: string) {
        Column(column)(entity, name);
        const entityMetadata = EntityMetadata.get(entity);
        entityMetadata.updatedAtColumn = column || name;
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, entity);
    };
}

type RelationshipsList = typeof BelongsTo | typeof HasOne | typeof HasMany | typeof BelongsToMany;

export function Relation<T extends Entity, R extends Entity>(
    type: () => EntityConstructor<R>,
    // tslint:disable-next-line:no-any
    inverseBy: KeysOfType<Omit<R, keyof Entity>, Entity | HasOne<any> | BelongsTo<any> | HasMany<any> | BelongsToMany<any>>,
    // options: Partial<RelationshipOptions> = {}
) {
    return function (entity: T, property: string) {
        const entityMetadata = EntityMetadata.get(entity);
        const fieldClass = Reflect.getMetadata('design:type', entity, property) as RelationshipsList;
        const entityClass = entity.constructor as EntityConstructor<T>;

        // @ts-ignore
        const relationship = fieldClass.relationship(entityClass, property, type, inverseBy as string, {});
        if (fieldClass === BelongsTo) {
            entityMetadata.relationships[property] = relationship;
        } else {
            entityMetadata.inverseRelationships[property] = relationship;
        }
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, entity);
    };
}

// export function HasOne<T extends Entity, R extends Entity>(
//     type: () => EntityConstructor<R>,
//     inverseBy: KeysOfType<R, Entity>
// ) {
//     return function (parent: T, property: string) {
//         const field = new HasOneField(parent.constructor as EntityConstructor<Entity>, property, type, inverseBy as string);
//         setInverseRelationshipField(parent, field);
//     };
// }
//
// export function HasMany<T extends Entity, R extends Entity>(
//     type: () => EntityConstructor<R>,
//     inverseBy: KeysOfType<R, Entity>,
//     column?: string
// ) {
//     return function (parent: T, property: string) {
//         const field = new HasManyField(parent.constructor as EntityConstructor<Entity>, property, type, inverseBy as string);
//         setInverseRelationshipField(parent, field);
//     };
// }
//
// export function BelongsTo<T extends Entity, R extends Entity>(
//     type: () => EntityConstructor<R>,
//     // tslint:disable-next-line:no-any
//     inverseBy: KeysOfType<R, Entity | List<any, any>>,
//     column?: string
// ) {
//     return function (parent: T, property: string) {
//         const parentConstructor = parent.constructor as EntityConstructor<T>;
//         column = column || property + (parentConstructor.getPrimaryKey() as string).capitalize();
//         const field = new BelongsToField(parentConstructor, property, type, inverseBy as string, column);
//         setRelationshipField(parent, field);
//         // TODO refactor needed. This is used when setting the value of the relation to an entity instance. It will get
//         // only the foreign key value instead of passing the entire object, which cannot be save in the database.
//         // const entityMetadata = EntityMetadata.get(parent);
//         // entityMetadata.columns[column] = field;
//         // Reflect.defineMetadata(EntityMetadataKey, entityMetadata, parent);
//     };
// }
//
// export function BelongToMany<T extends Entity, R extends Entity>(
//     type: () => EntityConstructor<R>,
//     // tslint:disable-next-line:no-any
//     inverseBy: KeysOfType<R, List<any, any>>,
//     joinTable?: string,
//     tableColumn?: string,
//     foreignColumn?: string
// ) {
//     return function (parent: T, name: string) {
//         const parentConstructor = parent.constructor as EntityConstructor<T>;
//         const field = new BelongsToManyField<T, R>(
//             parentConstructor,
//             name,
//             type,
//             inverseBy as string,
//             joinTable,
//             tableColumn,
//             foreignColumn
//         );
//         setInverseRelationshipField(parent, field);
//     };
// }

