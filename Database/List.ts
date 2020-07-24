import { Entity } from './Entity';
import { EntityKeys, EntityObject } from './index';
import { EntityQuery } from './EntityQuery';
import { Boolean, Operator, WhereValue } from './Types';
import { BelongsToManyField, HasManyField } from './Fields';
import { RelationClass } from './ORM/RelationClass';

export class List<E extends Entity, P extends Entity = Entity> extends RelationClass<E, P> implements Iterable<E>, ArrayLike<E> {

    items: E[] = [];

    public relationship: HasManyField<E, P> | BelongsToManyField<E, P>;

    constructor(
        relationship: HasManyField<E, P> | BelongsToManyField<E, P>,
        parent: P
    ) {
        super(relationship, parent);
        return new Proxy(this, new ListProxyHandler());
    }

    [Symbol.iterator]() {
        return this.items[Symbol.iterator]();
    }

    get length() {
        return this.items.length;
    }

    readonly [n: number]: E;

    async save(...items: Partial<EntityObject<E> | E>[]) {
        if (!this.parent.exists) {
            await this.parent.save();
        }
        const instances = await this.relationship.save(items, this.parent);

        this.items.push(...instances);

        return this.items;
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
        return new EntityQuery(this.relationship.entity).table(this.relationship.entity.getTable());
    }

    where<K extends EntityKeys<E>>(
        column: EntityKeys<E>,
        operator: Operator | WhereValue | E[K],
        value?: WhereValue | E[K],
        boolean?: Boolean
    ): EntityQuery<E> {
        return this.relationship.getQuery(this.parent as E & P).where(column, operator, value, boolean);
    }

    findWhere(name: string, value: string): E | undefined {
        return undefined;
    }
}

export class ListProxyHandler<E extends Entity, P extends Entity> {
    constructor() {
    }

    get(target: List<E, P>, property: string | number) {
        if (Number.isInteger(Number(property.toString()))) {
            return target.items[property as number];
        }
        return target[property as keyof List<E, P>];
    }
}
