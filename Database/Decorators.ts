import { ChildObject, KeysOfType } from '../Support'
import { Entity } from './Entity'
import {
    BelongsTo,
    BelongsToMany,
    BelongsToManyField,
    BelongsToManyFieldOptions,
    ColumnField,
    HasMany,
    HasManyField,
    HasOne,
    HasOneField,
    PrimaryField,
    RelationshipField
} from './Fields'
import { EntityConstructor } from './index'
import { List } from './List'
import { BaseRelationship } from './ORM/BaseRelationship'

export const EntityMetadataKey = 'framework:entity'

export type ID = number;

export class EntityOptions<T extends Entity> {
    table?: string
    touch?: KeysOfType<T, Entity | List<T, Entity>>[]
}

export class EntityMetadata<T extends Entity> extends EntityOptions<T> {
    columns: Record<string, ColumnField<T>> = {}
    relationships: Record<string, RelationshipField<T, Entity>> = {}
    inverseRelationships: Record<string, BelongsToManyField<T, Entity> | HasManyField<T, Entity> | HasOneField<T, Entity>> = {}
    createdAtColumn?: string
    updatedAtColumn?: string

    get allRelationships() {
        return {...this.relationships, ...this.inverseRelationships}
    }

    static get<T extends Entity>(entity: T) {
        const metadata: EntityMetadata<T> = Reflect.getMetadata(EntityMetadataKey, entity) || new this()
        metadata.table = metadata?.table || entity.constructor.name.toLowerCase()
        return metadata
    }
}

export function Options<T extends Entity>(options: EntityOptions<T> = {}) {
    return (entity: typeof Entity) => {
        const metadata = EntityMetadata.get(entity.prototype)
        options.table = options.table || entity.name.toLowerCase()
        Object.assign(metadata, options)
        Reflect.defineMetadata(EntityMetadataKey, metadata, entity.prototype)
    }
}

function setField<T extends Entity>(entity: T, field: ColumnField<T>) {
    const entityMetadata = EntityMetadata.get(entity)
    entityMetadata.columns[field.property] = field
    Reflect.defineMetadata(EntityMetadataKey, entityMetadata, entity)
}

export function Column<T extends Entity>(column?: string) {
    return function (entity: T, name: string) {
        const type = Reflect.getMetadata('design:type', entity, name)
        const field = new ColumnField(entity.constructor as EntityConstructor<T>, name, () => type, column || name)
        setField(entity, field)
    }
}

export function Enum<T extends Entity>(...values: string[]) {
    return function (entity: T, name: string) {
    }
}

export function PrimaryColumn<T extends Entity>(column?: string) {
    return function (entity: T, name: string) {
        const type = Reflect.getMetadata('design:type', entity, name)
        const field = new PrimaryField(entity.constructor as EntityConstructor<T>, name, () => type, column || name)
        setField(entity, field)
    }
}

export function CreatedAt<T extends Entity>(column?: string) {
    return function (entity: T, name: string) {
        Column(column)(entity, name)
        const entityMetadata = EntityMetadata.get(entity)
        entityMetadata.createdAtColumn = column || name
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, entity)
    }
}

export function UpdatedAt<T extends Entity>(column?: string) {
    return function (entity: T, name: string) {
        Column(column)(entity, name)
        const entityMetadata = EntityMetadata.get(entity)
        entityMetadata.updatedAtColumn = column || name
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, entity)
    }
}

type RelationshipsList = typeof BelongsTo | typeof HasOne | typeof HasMany | typeof BelongsToMany;
const entityOptionsCache = new Map<Entity, Record<string, object>>()

export function Relation<T extends Entity, R extends Entity>(
    type: () => EntityConstructor<R>,
    // tslint:disable-next-line:no-any
    // inverseBy: KeysOfType<Omit<R, keyof Entity>, Entity | HasOne<any> | BelongsTo<any> | HasMany<any> | BelongsToMany<any>>,
    // tslint:disable-next-line:no-any
    // inverseBy: KeysOfType<R, Entity | HasOne<any> | BelongsTo<any> | HasMany<any> | BelongsToMany<any>>,
    // tslint:disable-next-line:no-any
    inverseBy: KeysOfType<ChildObject<R, Entity>, BaseRelationship<T>>,
    // options: Partial<RelationshipOptions> = {}
) {
    return function (entity: T, property: string) {
        let entityMetadata = EntityMetadata.get(entity)
        const fieldClass = Reflect.getMetadata('design:type', entity, property) as RelationshipsList
        const entityClass = entity.constructor as EntityConstructor<T>

        const options = entityOptionsCache.get(entity) || {}
        // @ts-ignore
        entityMetadata = fieldClass.relationship(entityMetadata, entityClass, property, type, inverseBy as string, options[property])
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, entity)
    }
}

export function BelongsToManyOptions<T extends Entity>(options: BelongsToManyFieldOptions) {
    return function (entity: T, property: string) {
        const entityOptions = entityOptionsCache.get(entity) || {}
        entityOptions[property] = options
        entityOptionsCache.set(entity, entityOptions)
    }
}
