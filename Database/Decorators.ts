import { Constructor, KeysOfType } from '../Support';
import { Entity as BaseEntity } from './Entity';
import { ColumnField, ManyToOneField, OneToManyField } from './Fields';

export const EntityMetadataKey = 'framework:entity';

export class EntityOptions<T> {
    timestamps?: boolean;
    table?: string;
    touch?: KeysOfType<T, BaseEntity | BaseEntity[]>[];
}

// export interface EntityMetadata<T = {}> extends EntityOptions<T> {
//     columns?: { [key: string]: ColumnField };
// }

// const defaultMetadata: EntityMetadata = {
//     columns: {}
// };

export class EntityMetadata<T = {}> extends EntityOptions<T> {
    columns: {[key: string]: ColumnField} = {};

    static get(target: BaseEntity) {
        const entityMetadata = new this();
        const metadata: EntityMetadata<BaseEntity> = Reflect.getMetadata(EntityMetadataKey, target);
        return Object.assign(entityMetadata, metadata);
    }
}

export function Entity<T extends BaseEntity>(options: EntityOptions<T> = {}) {
    return (target: typeof BaseEntity) => {
        let entityMetadata = EntityMetadata.get(target.prototype);
        entityMetadata = Object.assign(entityMetadata, options);
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, target.prototype);
    };
}

function setEntityMetadata(target: BaseEntity, field: ColumnField) {
    const entityMetadata = EntityMetadata.get(target);
    entityMetadata.columns[field.name] = field;
    Reflect.defineMetadata(EntityMetadataKey, entityMetadata, target);
}

export function Column<T extends BaseEntity>(column?: string) {
    return function (target: T, name: string) {
        const type = Reflect.getMetadata('design:type', target, name);
        const field = new ColumnField(name, type, column || name);
        setEntityMetadata(target, field);
    };
}

export type ID = number;

export function OneToMany<T extends BaseEntity>(type: Constructor<T>, inverseBy: KeysOfType<T, BaseEntity>, column?: string) {
    return function (target: BaseEntity, name: string) {
        const field = new OneToManyField(name, type, inverseBy as string, column || name);
        setEntityMetadata(target, field);
    };
}

export function ManyToOne<T extends BaseEntity>(model: Constructor<T>, inverseBy: KeysOfType<T, BaseEntity[]>, column?: string) {
    return function (target: BaseEntity, name: string) {
        const type = Reflect.getMetadata('design:type', target, name);
        const field = new ManyToOneField(name, type, inverseBy as string, column || name);
        setEntityMetadata(target, field);
    };
}

