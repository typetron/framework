import { Constructor, KeysOfType } from '../Support';
import { Entity } from './Entity';
import { ColumnField, ManyToManyField, ManyToOneField, OneToManyField } from './Fields';

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
    columns: {[key: string]: ColumnField} = {};

    static get(target: Entity) {
        const entityMetadata = new this();
        const metadata: EntityMetadata<Entity> = Reflect.getMetadata(EntityMetadataKey, target);
        return Object.assign(entityMetadata, metadata);
    }
}

export function Meta<T extends Entity>(options: EntityOptions<T> = {}) {
    return (target: typeof Entity) => {
        let entityMetadata = EntityMetadata.get(target.prototype);
        entityMetadata = Object.assign(entityMetadata, options);
        Reflect.defineMetadata(EntityMetadataKey, entityMetadata, target.prototype);
    };
}

function setEntityMetadata(target: Entity, field: ColumnField) {
    const entityMetadata = EntityMetadata.get(target);
    entityMetadata.columns[field.name] = field;
    Reflect.defineMetadata(EntityMetadataKey, entityMetadata, target);
}

export function Column<T extends Entity>(column?: string) {
    return function (target: T, name: string) {
        const type = Reflect.getMetadata('design:type', target, name);
        const field = new ColumnField(name, type, column || name);
        setEntityMetadata(target, field);
    };
}

export type ID = number;

export function OneToMany<T extends Entity>(type: Constructor<T>, inverseBy: KeysOfType<T, Entity>, column?: string) {
    return function (target: Entity, name: string) {
        const field = new OneToManyField(name, type, inverseBy as string, column || name);
        setEntityMetadata(target, field);
    };
}

export function ManyToOne<T extends Entity>(entity: Constructor<T>, inverseBy: KeysOfType<T, Entity[]>, column?: string) {
    return function (target: Entity, name: string) {
        const type = Reflect.getMetadata('design:type', target, name);
        const field = new ManyToOneField(name, type, inverseBy as string, column || name);
        setEntityMetadata(target, field);
    };
}

export function ManyToMany<T extends Entity>(entity: () => Constructor<T>, inverseBy: KeysOfType<T, Entity[]>, joinTable: string, tableColumn?: string, foreignColumn?: string) {
    return function (target: Entity, name: string) {
        setTimeout(() => {
            const type = Reflect.getMetadata('design:type', target, name);
            const field = new ManyToManyField(name, type, inverseBy as string, joinTable, tableColumn || target.constructor.name, foreignColumn || entity().name);
            setEntityMetadata(target, field);
        }, 0);
    };
}

