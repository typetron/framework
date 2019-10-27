import { EntityProxyHandler } from './EntityProxyHandler';
import { EntityQuery as Query } from './EntityQuery';
import { ChildObject, KeysOfType } from '../Support';
import { EntityMetadata, EntityMetadataKey } from './Decorators';
import { EntityNotFoundError } from './EntityNotFoundError';
import { ColumnField } from './Fields';
import { Boolean, Operator, WhereValue } from './Types';
import { EntityConstructor, EntityKeys } from './index';

export abstract class Entity {

    protected exists = false;
    public original: {[key: string]: object} = {};

    constructor(data?: object) {
        if (data) {
            this.fill(data as ChildObject<this, Entity>);
        }
        return new Proxy(this, new EntityProxyHandler(this));
    }

    static get metadata(): EntityMetadata<Entity> {
        return Reflect.getMetadata(EntityMetadataKey, this.prototype);
    }

    get metadata(): EntityMetadata<Entity> {
        return Reflect.getMetadata(EntityMetadataKey, this);
    }

    protected get static(): EntityConstructor<this> {
        return this.constructor as EntityConstructor<this>;
    }

    static where<T extends Entity, K extends EntityKeys<T>>(this: EntityConstructor<T>, column: EntityKeys<T>, operator: Operator | WhereValue | T[K], value?: WhereValue | T[K], boolean?: Boolean): Query<T> {
        return this.newQuery().where(column, operator, value, boolean);
    }

    static whereIn<T extends Entity, K extends EntityKeys<T>>(this: EntityConstructor<T>, column: EntityKeys<T>, value: WhereValue[] | T[K][], boolean?: Boolean): Query<T> {
        return this.newQuery().whereIn(column, value, boolean);
    }

    static whereLike<T extends Entity, K extends EntityKeys<T>>(this: EntityConstructor<T>, column: EntityKeys<T>, value?: WhereValue | T[K], boolean?: Boolean): Query<T> {
        return this.newQuery().whereLike(column, value as WhereValue, boolean);
    }

    static getTable<T extends Entity>(this: EntityConstructor<T>): string {
        return this.metadata.table || this.name.toLowerCase();
    }

    static newInstance<T extends Entity>(this: EntityConstructor<T>, data = {}, exists = false): T {
        const instance = new this;
        instance.fill(data);
        instance.exists = exists;
        instance.original = data;

        return instance as T;
    }

    static create<T extends Entity>(this: EntityConstructor<T>, data: ChildObject<T, Entity> | {}): Promise<T> {
        return (new this).fill(data).save();
    }

    static async get<T extends Entity>(this: EntityConstructor<T>, columns: (EntityKeys<T> | '*')[] = ['*']): Promise<T[]> {
        return this.newQuery().get(columns);
    }

    static with<T extends Entity, K extends KeysOfType<T, Entity | Entity[]>>(this: EntityConstructor<T>, ...relations: K[]) {
        return this.newQuery().with(...relations);
    }

    static async find<T extends Entity>(this: EntityConstructor<T>, id: number): Promise<T> {
        const query = this.newQuery().where('id' as keyof T, id);
        const data = await query.first() || {};
        if (!data || !Object.entries(data).length) {
            throw new EntityNotFoundError(`No records found for entity '${this.name}' using query '${query.toSql()}' with parameters [${query.getBindings().join(', ')}]`);
        }
        return this.newInstance(data, true) as T;
    }

    static getPrimaryKey<T extends Entity>(): EntityKeys<T> {
        return 'id' as EntityKeys<T>;
    }

    static hydrate<T extends Entity>(modelType: EntityConstructor<T>, models: {}[], exist = false) {
        return models.map(data => {
            return modelType.newInstance(data, exist);
        });
    }

    static newQuery<T extends Entity>(this: EntityConstructor<T>): Query<T> {
        return (new Query(this, this.metadata)).table(this.getTable());
    }

    getTable(): string {
        return this.static.getTable();
    }

    async load<K extends KeysOfType<this, Entity | Entity[]>>(...relations: K[]) {
        await this.newQuery().with(...relations).eagerLoadRelationships([this]);

        return this;
    }

    newQuery(): Query<this> {
        return this.static.newQuery();
    }

    async save(): Promise<this> {
        const columns = this.metadata.columns;

        if (this.metadata.timestamps) {
            this.updateTimestamps();
        }

        // tslint:disable-next-line:no-any
        const data: {[key: string]: any} = {};

        Object.keys(columns).forEach((column) => {
            const type = columns[column];
            const newVar = type.value(this, this[column as keyof Entity]);
            if (type instanceof ColumnField && type.column) {
                data[type.column] = newVar;
            }
        });

        const query = this.newQuery();

        if (this.exists) {
            delete data[this.getPrimaryKey() as string];
            await query.where(this.getPrimaryKey(), this[this.getPrimaryKey()]).update(data);
        } else {
            await query.insert(data);
            const id = await Query.lastInsertedId();
            this.fill({id});
        }

        return this;
    }

    async delete() {
        if (!this.exists) {
            return;
        }

        this.newQuery().where(this.getPrimaryKey(), this[this.getPrimaryKey()]).delete();
    }

    fill(data: ChildObject<this, Entity> | {}) {
        Object.keys(data).forEach(key => {
            // @ts-ignore
            const value = data[key];
            const property = this.metadata.columns[key];
            if (property) {
                this[key as keyof this] = this.convertValueToType(value, property);
            }
        });

        return this;
    }

    getPrimaryKey<T extends Entity>(this: T): EntityKeys<T> {
        return this.static.getPrimaryKey();
    }

    toString() {
        return JSON.stringify(this.toObject());
    }

    toObject() {
        return Object.keys(this.metadata.columns)
            .reduce((obj, key) => {
                obj[key as keyof this] = this[key as keyof this];
                return obj;
            }, <{ [K in keyof this]: this[K] }>{});
    }

    protected getCreatedAtColumnName(): string {
        return 'createdAt';
    }

    protected getUpdatedAtColumnName(): string {
        return 'updatedAt';
    }

    private updateTimestamps() {
        this.fill({
            [this.getCreatedAtColumnName()]: this[this.getCreatedAtColumnName() as keyof this] || new Date(),
            [this.getUpdatedAtColumnName()]: new Date(),
        });
    }

    private convertValueToType(value: object, property: ColumnField<Entity>) {
        const converter = types.get(property.type) || (() => value);
        return converter(value);
    }
}

const types: Map<Function, Function> = new Map();
types.set(Date, (value: number) => new Date(value));

// let handler = {
// 	set: (target, prop, value) => {
// 		console.log(target, prop, value);
// 		target[prop] = value;
// 		return true;
// 	},
// 	get: (target, prop) => {
// 		if(!(prop in Entity))
// 			return () => {return new Query};
// 		return target[prop];
// 	}
// };

// Object.setPrototypeOf(Entity, new Proxy({}, new EntityProxyHandler(Entity)));
