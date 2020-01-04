import { EntityProxyHandler } from './EntityProxyHandler';
import { EntityQuery } from './EntityQuery';
import { ChildObject, KeysOfType } from '../Support';
import { EntityMetadata, EntityMetadataKey } from './Decorators';
import { EntityNotFoundError } from './EntityNotFoundError';
import { ColumnField, ManyToManyField } from './Fields';
import { Boolean, Direction, Operator, SqlValue, SqlValueMap, WhereValue } from './Types';
import { EntityConstructor, EntityKeys } from './index';
import { Query } from './Query';

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

    static where<T extends Entity, K extends EntityKeys<T>>(this: EntityConstructor<T>, column: EntityKeys<T>, operator: Operator | WhereValue | T[K], value?: WhereValue | T[K], boolean?: Boolean): EntityQuery<T> {
        return this.newQuery().where(column, operator, value, boolean);
    }

    static whereIn<T extends Entity, K extends EntityKeys<T>>(this: EntityConstructor<T>, column: EntityKeys<T>, value: WhereValue[] | T[K][], boolean?: Boolean): EntityQuery<T> {
        return this.newQuery().whereIn(column, value, boolean);
    }

    static whereLike<T extends Entity, K extends EntityKeys<T>>(this: EntityConstructor<T>, column: EntityKeys<T>, value?: WhereValue | T[K], boolean?: Boolean): EntityQuery<T> {
        return this.newQuery().whereLike(column, value as WhereValue, boolean);
    }

    static orderBy<T extends Entity, K extends EntityKeys<T>>(this: EntityConstructor<T>, column: EntityKeys<T>, direction?: Direction): EntityQuery<T> {
        return this.newQuery().orderBy(column, direction);
    }

    static getTable<T extends Entity>(this: EntityConstructor<T>): string {
        return this.metadata.table || this.name.toLowerCase();
    }

    static newInstance<T extends Entity>(this: EntityConstructor<T>, data = {}, exists = false): T {
        const instance = new this;
        instance.exists = exists;
        instance.original = data;
        instance.fill(data);

        return instance;
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
        const instance = await query.first();
        if (!instance || !Object.entries(instance).length) {
            throw new EntityNotFoundError(`No records found for entity '${this.name}' using query '${query.toSql()}' with parameters [${query.getBindings().join(', ')}]`);
        }
        return instance;
    }

    static getPrimaryKey<T extends Entity>(): EntityKeys<T> {
        return 'id' as EntityKeys<T>;
    }

    static hydrate<T extends Entity>(modelType: EntityConstructor<T>, models: {}[], exist = false) {
        return models.map(data => {
            return modelType.newInstance(data, exist);
        });
    }

    static newQuery<T extends Entity>(this: EntityConstructor<T>): EntityQuery<T> {
        return (new EntityQuery(this, this.metadata)).table(this.getTable());
    }

    getTable(): string {
        return this.static.getTable();
    }

    async load<K extends KeysOfType<this, Entity | Entity[]>>(...relations: K[]) {
        await this.newQuery().with(...relations).eagerLoadRelationships([this]);

        return this;
    }

    newQuery(): EntityQuery<this> {
        return this.static.newQuery();
    }

    async save(): Promise<this> {
        const columns = this.metadata.columns;

        if (this.metadata.timestamps) {
            this.updateTimestamps();
        }

        // tslint:disable-next-line:no-any
        const data: {[key: string]: any} = {};

        const manyToManyRelationships: ManyToManyField<this, Entity>[] = [];

        // TODO diff the values so we don't update every value from the entity
        Object.keys(columns).forEach((column) => {
            const type = columns[column];
            if (type instanceof ColumnField && type.column) { // TODO add tests to verify this
                data[type.column] = type.relationshipColumnValue(this, this[column as keyof Entity]);
            }
            if (type instanceof ManyToManyField) {
                manyToManyRelationships.push(type);
            }
        });

        const query = this.newQuery();

        if (this.exists) {
            delete data[this.getPrimaryKey() as string];
            await query.where(this.getPrimaryKey(), this[this.getPrimaryKey()]).update(data);
        } else {
            await query.insert(data);
            const id = await EntityQuery.lastInsertedId();
            this.fill({id});
        }

        await this.syncRelationships(manyToManyRelationships);

        return this;
    }

    fill(data: ChildObject<this, Entity> | {}) {
        Object.keys(data).forEach(key => {
            const property = this.metadata.columns[key];
            if (property) {
                // @ts-ignore
                const value = property.value(data as this, data[key]) as object;
                this[key as keyof this] = this.convertValueToType(value, property);
            }
        });

        return this;
    }

    async delete() {
        if (!this.exists) {
            return;
        }

        this.newQuery().where(this.getPrimaryKey(), this[this.getPrimaryKey()]).delete();
    }

    async sync(property: KeysOfType<this, Entity[]>, ids: number[], detach = true) {
        const relatedField = this.metadata.columns[property as string] as ManyToManyField<this, Entity>;
        const existingRelations = await Query.table(relatedField.getPivotTable())
            .where(relatedField.getParentForeignKey(), this[this.getPrimaryKey()] as unknown as SqlValue)
            .get();
        const relatedIds = existingRelations.pluck(relatedField.getRelatedForeignKey());
        const idsToAdd = ids.filter(id => !relatedIds.includes(id));
        if (detach) {
            const idsToRemove = relatedIds.filter(id => !ids.includes(id as number));
            if (idsToRemove.length) {
                await Query.table(relatedField.getPivotTable())
                    .where(relatedField.getParentForeignKey(), this[this.getPrimaryKey()] as unknown as SqlValue)
                    .andWhereIn(relatedField.getRelatedForeignKey(), idsToRemove)
                    .delete();
            }
        }

        if (idsToAdd.length) {
            const relations: SqlValueMap[] = idsToAdd.map(id => {
                return {
                    [relatedField.getParentForeignKey()]: this[this.getPrimaryKey()] as unknown as number,
                    [relatedField.getRelatedForeignKey()]: id,
                };
            });
            await Query.table(relatedField.getPivotTable()).insert(relations);
        }
        return this;
    }

    private async syncRelationships(manyToManyRelationships: ManyToManyField<this, Entity>[]) {
        await manyToManyRelationships.forEachAsync(async (field) => {
            // @ts-ignore
            await this.sync(field.property, (this[field.property] as Entity[]).pluck(field.type().getPrimaryKey()));
        });
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

    private convertValueToType(value: unknown, property: ColumnField<Entity>) {
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
