import { EntityProxyHandler } from './EntityProxyHandler';
import { EntityQuery } from './EntityQuery';
import { ChildObject, KeysOfType } from '../Support';
import { EntityMetadata, EntityMetadataKey, ID } from './Decorators';
import { EntityNotFoundError } from './EntityNotFoundError';
import { BelongsTo, BelongsToMany, BelongsToManyField, ColumnField, HasMany, HasOne, InverseField } from './Fields';
import { Boolean, Direction, Operator, SqlValue, SqlValueMap, WhereValue } from './Types';
import { EntityConstructor, EntityKeys } from './index';
import { Query } from './Query';
import { RelationClass } from './ORM/RelationClass';

export abstract class Entity {

    exists = false;
    // tslint:disable-next-line:no-any
    original: Record<string, any> = {};

    constructor(data?: object) {
        if (data) {
            this.original = data;
            this.fill(data);
        }
        const entityProxyHandler = new EntityProxyHandler<this>();
        const proxy = new Proxy(this, entityProxyHandler);
        entityProxyHandler.entityProxy = proxy;
        return proxy;
    }

    static get metadata(): EntityMetadata<Entity> {
        return Reflect.getMetadata(EntityMetadataKey, this.prototype);
    }

    get metadata(): EntityMetadata<Entity> {
        return this.static.metadata;
    }

    get static(): EntityConstructor<this> {
        return this.constructor as EntityConstructor<this>;
    }

    static where<T extends Entity, K extends EntityKeys<T>>(
        this: EntityConstructor<T>,
        column: EntityKeys<T>,
        operator: Operator | WhereValue | T[K],
        value?: WhereValue | T[K],
        boolean?: Boolean
    ): EntityQuery<T> {
        return this.newQuery().where(column, operator, value, boolean);
    }

    static whereIn<T extends Entity, K extends EntityKeys<T>>(
        this: EntityConstructor<T>,
        column: EntityKeys<T>,
        value: WhereValue[] | T[K][],
        boolean?: Boolean
    ): EntityQuery<T> {
        return this.newQuery().whereIn(column, value, boolean);
    }

    static whereLike<T extends Entity, K extends EntityKeys<T>>(
        this: EntityConstructor<T>,
        column: EntityKeys<T>,
        value?: WhereValue | T[K],
        boolean?: Boolean
    ): EntityQuery<T> {
        return this.newQuery().whereLike(column, value as WhereValue, boolean);
    }

    static async first<T extends Entity, K extends EntityKeys<T>>(
        this: EntityConstructor<T>,
        ...columns: EntityKeys<T>[]
    ): Promise<T | undefined> {
        return this.newQuery().first(...columns);
    }

    // static first2: <T extends Entity>(this: EntityConstructor<T>, ...params: Parameters<Query<T>['first']>) =>  Query<T>['first'];

    // tslint:disable-next-line:no-any
    static async firstOrNew<T extends Entity, K extends keyof Entity>(
        this: EntityConstructor<T>,
        properties: Partial<ChildObject<T, Entity>>,
        values?: Partial<ChildObject<T, Entity>>
    ): Promise<T> {
        return this.newQuery().firstOrNew(properties, values);
    }

    // tslint:disable-next-line:no-any
    static async firstOrCreate<T extends Entity, K extends keyof Entity>(
        this: EntityConstructor<T>,
        properties: Partial<ChildObject<T, Entity>>,
        values?: Partial<ChildObject<T, Entity>>
    ): Promise<T> {
        return (await this.firstOrNew(properties, values)).save();
    }

    static orderBy<T extends Entity, K extends EntityKeys<T>>(
        this: EntityConstructor<T>,
        column: EntityKeys<T>,
        direction?: Direction
    ): EntityQuery<T> {
        return this.newQuery().orderBy(column, direction);
    }

    static getTable<T extends Entity>(this: EntityConstructor<T>): string {
        return this.metadata.table || this.name.toLowerCase(); // TODO make metadata.table un-optional
    }

    static new<T extends Entity, K extends keyof T>(
        this: EntityConstructor<T>,
        data = {},
        exists = false
    ): T {
        const instance = new this;
        instance.exists = exists;
        instance.original = data;
        instance.fill(data);

        return instance;
    }

    static create<T extends Entity>(this: EntityConstructor<T>, data: ChildObject<T, Entity> | {}): Promise<T> {
        return (new this).fill(data).save();
    }

    static async get<T extends Entity>(this: EntityConstructor<T>, ...columns: EntityKeys<T> []): Promise<T[]> {
        return this.newQuery().get(...columns);
    }

    // tslint:disable-next-line:no-any
    static with<T extends Entity, K extends KeysOfType<T, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>>>(
        this: EntityConstructor<T>,
        ...relations: K[]
    ) {
        return this.newQuery().with(...relations);
    }

    static withCount<T extends Entity, K extends KeysOfType<T, Entity | Entity[]>>(this: EntityConstructor<T>, ...relations: K[]) {
        return this.newQuery().withCount(...relations);
    }

    static async find<T extends Entity>(this: EntityConstructor<T>, id: string | number | ID): Promise<T> {
        const query = this.newQuery().where('id' as keyof T, id as number);
        const data = await query.first();
        if (!data || !Object.entries(data).length) {
            throw new EntityNotFoundError(`No records found for entity '${this.name}' when querying with parameters [${query.getBindings().join(', ')}]`);
        }
        return this.new(data, true);
    }

    static getPrimaryKey<T extends Entity>(): EntityKeys<T> {
        return 'id' as EntityKeys<T>;
    }

    static hydrate<T extends Entity>(modelType: EntityConstructor<T>, models: {}[], exist = false) {
        return models.map(data => {
            return modelType.new(data, exist);
        });
    }

    static newQuery<T extends Entity>(this: EntityConstructor<T>): EntityQuery<T> {
        return (new EntityQuery(this)).table(this.getTable());
    }

    getTable(): string {
        return this.static.getTable();
    }

    // tslint:disable-next-line:no-any
    async load<K extends KeysOfType<this, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>>>(
        ...relations: K[]
    ) {
        await this.newQuery().with(...relations).eagerLoadRelationships([this]);

        return this;
    }

    newQuery(): EntityQuery<this> {
        return this.static.newQuery();
    }

    async save(data: ChildObject<this, Entity> | {} = {}): Promise<this> {
        this.fill(data);

        this.updateTimestamps();

        // tslint:disable-next-line:no-any
        const dataToSave: Record<string, any> = {};

        // const manyToManyRelationships: BelongsToManyField<this, Entity>[] = [];

        // TODO diff the values so we don't update every value from the entity
        Object.values({...this.metadata.columns, ...this.metadata.relationships}).forEach(field => {
            dataToSave[field.column] = field.value(this, field.property);
        });

        const query = this.newQuery();

        if (this.exists) {
            delete dataToSave[this.getPrimaryKey() as string];
            await query.where(this.getPrimaryKey(), this[this.getPrimaryKey()]).update(dataToSave);
        } else {
            await query.insert(dataToSave);
            const id = await EntityQuery.lastInsertedId();
            this.exists = true;
            this.fill({id});
        }

        for await(const field of Object.values(this.metadata.inverseRelationships)) {
            const relationship = field.value(this, field.property) as RelationClass<Entity>;
            await relationship.save();
        }

        return this;
    }

    private updateTimestamps() {
        if (this.metadata.createdAtColumn && !this[this.metadata.createdAtColumn as keyof this]) {
            this.fill({
                [this.metadata.createdAtColumn]: new Date(),
            });
        }
        if (this.metadata.updatedAtColumn) {
            this.fill({
                [this.metadata.updatedAtColumn]: new Date(),
            });
        }
    }

    fill(data: ChildObject<this, Entity> | {}) {
        const fields = {...this.metadata.columns, ...this.metadata.relationships, ...this.metadata.inverseRelationships};
        Object.keys(data).forEach(key => {
            const field = fields[key];
            if (field) {
                const value = data[key as keyof {}];
                field.set(this, this.convertValueByType(value, field));
            }
        });

        return this;
    }

    async delete() {
        if (!this.exists) {
            return;
        }

        await this.newQuery().where(this.getPrimaryKey(), this[this.getPrimaryKey()]).delete();
    }

    async sync(property: string, ids: number[], detach = true) {
        const relatedField = this.metadata.inverseRelationships[property as string] as BelongsToManyField<this, Entity>;
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

    getPrimaryKey<T extends Entity>(this: T): EntityKeys<T> {
        return this.static.getPrimaryKey();
    }

    toJSON() {
        return Object.keys(this.metadata.columns)
            .reduce((obj, key) => {
                obj[key as keyof this] = this[key as keyof this];
                return obj;
            }, <{ [K in keyof this]: this[K] }>{});
    }

    private convertValueByType(value: unknown, property: ColumnField<Entity> | InverseField<Entity>) {
        const converter = types.get(property.type()) || (() => value);
        return converter(value);
    }
}

const types: Map<Function, Function> = new Map();
types.set(Date, (value: number) => new Date(value));
types.set(String, (value: object) => value ? String(value) : value);

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
