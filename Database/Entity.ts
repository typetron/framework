import { EntityProxyHandler } from './EntityProxyHandler';
import { Query } from './Query';
import { ChildObject, Constructor, KeysOfType } from '../Support';
import { EntityMetadata, EntityMetadataKey } from './Decorators';
import { EntityNotFoundError } from './EntityNotFoundError';
import { ColumnField, OneToManyField } from './Fields';
import { EntityConstructor } from './EntityConstructor';
import { Boolean, Operator, WhereValue } from './Types';
import { EntityKeys } from './index';

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

    static where<T extends Entity, K extends EntityKeys<T>>(this: EntityConstructor<T>, column: EntityKeys<T>, operator: Operator | WhereValue | T[K], value?: WhereValue | T[K], boolean?: Boolean): Query<ChildObject<T, Entity>> {
        const query = this.newQuery();
        // @ts-ignore
        return query.where.apply(query, arguments);
    }

    static async create<T extends Entity>(this: Constructor<T>, data: {}) {
        return await (new this).fill(data).save();
    }

    static getTable<T extends Entity>(this: EntityConstructor<T>): string {
        return (new this).getTable();
    }

    static newQuery<T extends Entity>(this: EntityConstructor<T>): Query<T> {
        return Query.table<T>(this.getTable());
    }

    // whereHas<T extends Entity>(this: T, relation: KeysOfType<T, Entity| Entity[]>) {
    // }
    // static whereHas<T extends Entity>(this: EntityConstructor<T>, relation: KeysOfType<T, Entity>) {
    // }

    // where<T extends Entity>(this: T, column: EntityKeys<T>, operator: Operator | WhereValue, value?: WhereValue, boolean: Boolean = 'AND') {
    // }

    static newInstance<T extends Entity>(this: EntityConstructor<T>, data = {}, exists = false): T {
        const instance = new this;
        instance.fill(data);
        instance.exists = exists;

        return instance;
    }

    static async get<T extends Entity>(this: Constructor<T>, columns = ['*']): Promise<T[]> {
        const model = new this;
        return model.get.call(model, columns);
    }

    static with<T extends Entity>(this: Constructor<T>, relations: string | string[]): T {
        const model = new this;
        return model.with.call(model, relations);
    }

    static async find<T extends Entity>(this: EntityConstructor<T>, id: number): Promise<T> {
        // @ts-ignore
        const query = this.newQuery().where('id', id);
        const data = await query.first() || {};
        if (!data || !Object.entries(data).length) {
            throw new EntityNotFoundError(`No results for model '${this.name}' for query '${query.toSql()}' with [${query.getBindings().join(', ')}]`);
        }
        return this.newInstance(data, true) as T;
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

    newQuery(): Query<this> {
        return Query.table(this.getTable());
    }

    async get(columns = ['*']): Promise<this[]> {
        const query = this.newQuery().select(columns);
        let models = await query.get();
        models = hydrate(this.constructor as Constructor<this>, models);

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
            const test = hydrate(relationMetadata.type as Constructor<Entity>, relationships);
            // this.addRelationsToEntities(relationships, relation);
        });

        return models as this[];
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

    async save(): Promise<this> {
        const columns = this._metadata_.columns;
        const data = {};

        Object.keys(columns).forEach(column => {
            const type = columns[column];
            // @ts-ignore
            const newVar = type.value(this, this[column]);
            if (newVar && type.constructor === ColumnField) {
                // @ts-ignore
                data[type.column] = newVar;
            }
        });
        const query = this.newQuery();
        query.insert(data);
        const id = await query.first();
        return this.fill({id} as unknown as ChildObject<this, Entity>);
    }

    fill(data: ChildObject<this, Entity>) {
        Object.keys(data).forEach(key => {
            // @ts-ignore
            const value = data[key];
            const property = this._metadata_.columns[key];
            if (property) {
                // @ts-ignore
                this[key] = value;
            }
        });

        return this;
    }

    getTable(): string {
        // return (this.constructor as typeof Entity).getTable();
        return this._metadata_.table ? this._metadata_.table : this.constructor.name.toLowerCase();
    }

    getPrimaryKey<K extends keyof this>(): K {
        // return this.primaryKey;
        return 'id' as K;
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
}

function hydrate<T extends Entity>(modelType: Constructor<T>, models: {}[]) {
    return models.map(data => {
        const model = new modelType;
        return model.fill(data);
    });
}

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
