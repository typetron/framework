import { Entity } from './Entity';
import { EntityConstructor, EntityKeys, EntityObject } from './index';
import { EntityQuery } from './EntityQuery';
import { Boolean, Operator, WhereValue } from './Types';
import { InverseRelationship, Relationship } from './Fields';

export class List<E extends Entity> implements Iterable<E>, ArrayLike<E> {

    items: E[] = [];

    constructor(
        public entityClass: EntityConstructor<E>,
        public parent: Entity,
        public property: keyof E,
    ) {
        return new Proxy(this, new ListProxyHandler());
    }

    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }

    get length() {
        return this.items.length;
    }

    readonly [n: number]: E;

    async save(...items: EntityObject<E>[]) {
        if (!this.parent.exists) {
            await this.parent.save();
        }
        for await (const item of items) {
            let instance: E;
            if (item instanceof Entity) {
                instance = item as E;
            } else {
                instance = this.entityClass.new(item);
            }

            instance.fill({
                [this.property]: this.parent
            });
            await instance.save();
            this.items.push(instance);
        }
    }

    get relationship(): Relationship<Entity, Entity> {
        const relationships = this.entityClass.metadata.relationships;
        return relationships[this.property as unknown as string];
    }

    push(...items: E[]) {
        this.items.push(...items);
    }

    async get() {
        // @ts-ignore
        await this.parent.load(this.relationship.inverseBy);
    }

    async clear() {

    }

    async toggle(...items: E[] | number[]) {

    }

    async has(...items: E[] | number[]) {

    }

    async remove(...items: E[] | number[]) {

    }

    newQuery(): EntityQuery<E> {
        return new EntityQuery(this.entityClass).table(this.entityClass.getTable());
    }

    where<K extends EntityKeys<E>>(
        column: EntityKeys<E>,
        operator: Operator | WhereValue | E[K],
        value?: WhereValue | E[K],
        boolean?: Boolean
    ): EntityQuery<E> {
        return this.newQuery()
            .where(column, operator, value, boolean)
            .andWhere(this.relationship.column, this.parent[this.parent.getPrimaryKey()]);
    }

    findWhere(name: string, value: string): E | undefined {
        return undefined;
    }
}

export class ListProxyHandler<T extends Entity> {
    constructor() {
    }

    get(target: List<T>, property: string | number) {
        if (Number.isInteger(Number(property.toString()))) {
            return target.items[property as number];
        }
        return target[property as keyof List<T>];
    }
}
