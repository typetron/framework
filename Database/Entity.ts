import { EntityProxyHandler } from './EntityProxyHandler';
import { EntityQuery as Query } from './EntityQuery';
import { ChildObject, KeysOfType } from '../Support';
import { EntityMetadata, EntityMetadataKey } from './Decorators';
import { EntityNotFoundError } from './EntityNotFoundError';
import { ColumnField, OneToManyField } from './Fields';
import { Boolean, Operator, WhereValue } from './Types';
import { EntityConstructor, EntityKeys } from './index';

// @EntityInheritanceCheck
export abstract class Entity {

    protected exists = false;

    private eagerLoad: string[] = [];

    constructor(data?: object) {
        if (data) {
            this.fill(data as ChildObject<this, Entity>);
        }
        return new Proxy(this, new EntityProxyHandler(this));
    }

    static get _metadata_(): EntityMetadata<Entity> {
        return Reflect.getMetadata(EntityMetadataKey, this.prototype);
    }

    get _metadata_(): EntityMetadata<Entity> {
        return Reflect.getMetadata(EntityMetadataKey, this);
    }

    get class(): EntityConstructor<this> {
        return this.constructor as EntityConstructor<this>;
    }

    static where<T extends Entity, K extends EntityKeys<T>>(this: EntityConstructor<T>, column: EntityKeys<T>, operator: Operator | WhereValue | T[K], value?: WhereValue | T[K], boolean?: Boolean): Query<T> {
        return this.newQuery().where(column, operator, value, boolean);
    }

    static whereLike<T extends Entity, K extends EntityKeys<T>>(this: EntityConstructor<T>, column: EntityKeys<T>, value?: WhereValue | T[K], boolean?: Boolean): Query<T> {
        return this.newQuery().whereLike(column, value as WhereValue, boolean);
    }

    static getTable<T extends Entity>(this: EntityConstructor<T>): string {
        return (new this).getTable();
    }

    static create<T extends Entity>(this: EntityConstructor<T>, data: ChildObject<T, Entity> | {}): Promise<T> {
        return (new this).fill(data).save();
    }

    // whereHas<T extends Entity>(this: T, relation: KeysOfType<T, Entity| Entity[]>) {
    // }
    // static whereHas<T extends Entity>(this: EntityConstructor<T>, relation: KeysOfType<T, Entity>) {
    // }

    // where<T extends Entity>(this: T, column: EntityKeys<T>, operator: Operator | WhereValue, value?: WhereValue, boolean: Boolean = 'AND') {
    // }

    static newQuery<T extends Entity>(this: EntityConstructor<T>): Query<T> {
        return (new Query(this)).table(this.getTable());
    }

    static newInstance<T extends Entity>(this: EntityConstructor<T>, data = {}, exists = false): T {
        const instance = new this;
        instance.fill(data);
        instance.exists = exists;

        return instance as T;
    }

    static async get<T extends Entity>(this: EntityConstructor<T>, columns: (EntityKeys<T> | '*')[] = ['*']): Promise<T[]> {
        const model = new this;
        return model.get.call(model, columns);
    }

    static with<T extends Entity>(this: EntityConstructor<T>, relations: string | string[]): T {
        const model = new this;
        return model.with.call(model, relations) as T;
    }

    // private static addRelationsToEntities(models: Entity[], relationships: Entity[], relation: string) {
    //     const groups = relationships.groupBy('user_id');
    //
    //     groups.forEach((group, modelId) => {
    //         const model = models.findWhere('id/primaryKey', modelId);
    //         model[relationKey] = group;
    //     });
    // }

    // static where<T extends Entity, K extends keyof T>(this: EntityConstructor<T>, column: EntityKeys<T>, operator: Operator | WhereValue | T[K], value?: WhereValue | T[K], boolean: Boolean = 'AND'): Query<T> {
    //     return this.newQuery<T>().where(column as string, operator, value, boolean);
    // }

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

    with(relations: string | string[]) {
        if (typeof relations === 'string') {
            relations = [relations];
        }
        this.eagerLoad = this.eagerLoad.concat(relations);

        return this;
    }

    async load<T extends Entity, K extends KeysOfType<T, Entity | Entity[]>>(this: T, relationship: K) {
        const metadata = this._metadata_;
        const relationMetadata = metadata.columns[relationship as keyof EntityMetadata] as OneToManyField;

        const relationshipEntity = relationMetadata.type.prototype as T;
        const relationshipEntityMetadata = relationshipEntity._metadata_;

        const instanceId = this[this.getPrimaryKey()];
        const relationshipsQuery = this.newQuery()
            .table(relationshipEntity.getTable())
            .where(relationshipEntityMetadata.columns[relationMetadata.inverseBy].column as K, instanceId as unknown as string);

        return relationshipsQuery.get();
    }

    newQuery(): Query<this> {
        return this.class.newQuery();
    }

    async get(columns: (EntityKeys<this> | '*')[] = ['*']): Promise<this[]> {
        const query = this.newQuery().select(columns);
        let models = await query.get();
        models = this.class.hydrate(this.class, models) as this[];

        // const dictionary: { [key in keyof this]?: this } = {};
        // models.forEach(model => {
        //     const modePrimaryKeyValue = model[model.getPrimaryKey()];
        //     dictionary[modePrimaryKeyValue] = model;
        // });

        const metadata = this._metadata_;
        await this.eagerLoad.forEachAsync(async (relation) => {
            const relationshipsIds = models.pluck(this.getPrimaryKey()) as unknown as string[];
            const relationMetadata = metadata.columns[relation as keyof EntityMetadata] as OneToManyField;
            const relationshipEntity = relationMetadata.type.prototype as Entity;
            const relationshipEntityMetadata = relationshipEntity._metadata_;
            const relationshipsQuery = this.newQuery()
                .table(relationshipEntity.getTable())
                .whereIn(relationshipEntityMetadata.columns[relationMetadata.inverseBy].column, relationshipsIds);
            const relationships = await relationshipsQuery.get();
            const relatedModels = this.class.hydrate(relationMetadata.type as EntityConstructor<this>, relationships);
            console.log('relatioships ->', relatedModels);
            // this.addRelationsToEntities(relationships, relation);
        });

        return models as this[];
    }

    async save(): Promise<this> {
        const columns = this._metadata_.columns;

        if (this._metadata_.timestamps) {
            this.updateTimestamps();
        }

        // tslint:disable-next-line:no-any
        const data: {[key: string]: any} = {};

        Object.keys(columns).forEach(column => {
            const type = columns[column];
            // @ts-ignore
            const newVar = type.value(this, this[column]);
            if (type.constructor === ColumnField) {
                // @ts-ignore
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

    getTable(): string {
        // return (this.constructor as typeof Entity).getTable();
        return this._metadata_.table ? this._metadata_.table : this.constructor.name.toLowerCase();
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
            const property = this._metadata_.columns[key];
            if (property) {
                this[key as keyof this] = this.convertValueToType(value, property);
            }
        });

        return this;
    }

    getPrimaryKey<T extends Entity>(this: T): EntityKeys<T> {
        return this.class.getPrimaryKey();
    }

    toString() {
        return JSON.stringify(this.toObject());
    }

    toObject() {
        return Object.keys(this._metadata_.columns)
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

    private convertValueToType(value: object, property: ColumnField) {
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
