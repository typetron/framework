import { ChildObject, Constructor, KeysOfType } from '@Typetron/Support'
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
    JSONField,
    PrimaryField,
    RelationshipField
} from './Fields'
import { EntityConstructor } from './index'
import { List } from './List'
import { BaseRelationship } from './ORM/BaseRelationship'

export const EntityMetadataKey = 'framework:entity'

export type ID = number | string;

export class EntityOptions<T extends Entity> {
    table?: string
    touch?: KeysOfType<T, Entity | List<T, Entity>>[]
}

export class EntityMetadata<T extends Entity, R extends Entity> extends EntityOptions<T> {
    columns: Record<string, ColumnField<T>> = {}
    relationships: Record<string, RelationshipField<T, R>> = {}
    inverseRelationships: Record<string, BelongsToManyField<T, R> | HasManyField<T, R> | HasOneField<T, R>> = {}
    createdAtColumn?: string
    updatedAtColumn?: string

    get allRelationships() {
        return {...this.relationships, ...this.inverseRelationships}
    }

    static get<T extends Entity, R extends Entity>(entity: T) {
        const metadata: EntityMetadata<T, R> = Reflect.getMetadata(EntityMetadataKey, entity) || new this()
        metadata.table = metadata?.table || entity.constructor.name.toLowerCase()
        return metadata
    }
}

export function Options<T extends Entity>(options: EntityOptions<T> = {}) {
    return (entity: object) => {
        const entityClass = entity as unknown as EntityConstructor<T>
        const metadata = EntityMetadata.get(entityClass.prototype)
        options.table = options.table || entityClass.name.toLowerCase()
        Object.assign(metadata, options)
        Reflect.defineMetadata(EntityMetadataKey, metadata, entityClass.prototype)
    }
}

function setField<T extends Entity>(entity: T, field: ColumnField<T>) {
    const entityMetadata = EntityMetadata.get(entity)
    entityMetadata.columns[field.property] = field
    Reflect.defineMetadata(EntityMetadataKey, entityMetadata, entity)
}

export function Column<T extends Entity>(column?: string | {type: any}, options?: {type: any}): PropertyDecorator {
    return function(entity: Object, name: string | symbol) {
        const actualColumn: string | undefined = typeof column === 'string' ? column : undefined
        const type = options?.type ?? Reflect.getMetadata('design:type', entity, name)
        const field = new ColumnField(entity.constructor as EntityConstructor<T>, String(name), () => type, actualColumn || String(name))
        setField(entity as T, field)
    }
}

export function JSONColumn<T extends Entity>(column?: string) {
    return function(entity: object, name: string) {
        const field = new JSONField(entity.constructor as EntityConstructor<T>, name, () => String, column || name)
        setField(entity as T, field)
    }
}

export function Enum<T extends Entity>(...values: string[]) {
    return function(entity: object, name: string) {
    }
}

export function PrimaryColumn<T extends Entity>(column?: string) {
    return function(entity: object, name: string) {
        const type = Reflect.getMetadata('design:type', entity, name)
        const field = new PrimaryField(entity.constructor as EntityConstructor<T>, name, () => type, column || name)
        setField(entity as T, field)
    }
}

export function CreatedAt<T extends Entity>(column?: string) {
    return function(entity: object, name: string) {
        Column(column)(entity as T, name)
        const entityMetadata = EntityMetadata.get(entity as T)
        entityMetadata.createdAtColumn = column || name
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, entity)
    }
}

export function UpdatedAt<T extends Entity>(column?: string) {
    return function(entity: object, name: string) {
        Column(column)(entity as T, name)
        const entityMetadata = EntityMetadata.get(entity as T)
        entityMetadata.updatedAtColumn = column || name
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, entity)
    }
}

type RelationshipsList = typeof BelongsTo | typeof HasOne | typeof HasMany | typeof BelongsToMany;
const entityOptionsCache = new Map<Entity, Record<string, object>>()

export function Relation<T extends Entity, R extends Entity>(
    type: () => Constructor<R>,
    // tslint:disable-next-line:no-any
    // inverseBy: KeysOfType<Omit<R, keyof Entity>, Entity | HasOne<any> | BelongsTo<any> | HasMany<any> | BelongsToMany<any>>,
    // tslint:disable-next-line:no-any
    // inverseBy: KeysOfType<R, Entity | HasOne<any> | BelongsTo<any> | HasMany<any> | BelongsToMany<any>>,
    // tslint:disable-next-line:no-any
    inverseBy: KeysOfType<ChildObject<R, Entity>, BaseRelationship<T>>,
    // options: Partial<RelationshipOptions> = {}
) {
    return function(entity: object, property: string) {
        let entityMetadata = EntityMetadata.get(entity as T)
        const fieldClass = Reflect.getMetadata('design:type', entity, property) as RelationshipsList
        const entityClass = entity.constructor as EntityConstructor<T>

        const options = entityOptionsCache.get(entity as T) || {}
        // @ts-ignore
        entityMetadata = fieldClass.relationship(entityMetadata, entityClass, property, type, inverseBy as string, options[property])
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, entity)
    }
}

export function BelongsToManyOptions<T extends Entity>(options: BelongsToManyFieldOptions) {
    return function(entity: object, property: string) {
        const entityOptions = entityOptionsCache.get(entity as T) || {}
        entityOptions[property] = options
        entityOptionsCache.set(entity as T, entityOptions)
    }
}
