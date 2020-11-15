import { Entity } from './Entity'
import { EntityKeys } from './index'
import { EntityQuery } from './EntityQuery'
import { Boolean, Operator, WhereValue } from './Types'
import { BelongsToManyField, HasManyField } from './Fields'
import { BaseRelationship as Relationship } from './ORM/BaseRelationship'

export abstract class List<E extends Entity, P extends Entity = Entity> extends Relationship<E, P> implements Iterable<E>, ArrayLike<E> {

    items: E[] = []

    public relationship: HasManyField<P, E> | BelongsToManyField<P, E>

    protected constructor(
        relationship: HasManyField<P, E> | BelongsToManyField<P, E>,
        parent: P
    ) {
        super(relationship, parent)
        return new Proxy(this, new ListProxyHandler())
    }

    get length() {
        return this.items.length
    }

    [Symbol.iterator]() {
        return this.items[Symbol.iterator]()
    }

    readonly [n: number]: E;

    async load() {
        await this.parent.load(this.relationship.property)
        return this
    }

    async get() {
        await this.load()
        return this.items
    }

    newQuery(): EntityQuery<E> {
        return this.relationship.getQuery(this.parent)
    }

    where<K extends EntityKeys<E>>(
        column: EntityKeys<E>,
        operator: Operator | WhereValue | E[K],
        value?: WhereValue | E[K],
        boolean?: Boolean
    ): EntityQuery<E> {
        return this.relationship.getQuery(this.parent).where(column, operator, value, boolean)
    }

    findWhere(name: string, value: string): E | undefined {
        return undefined
    }

    toJSON() {
        return this.items
    }
}

export class ListProxyHandler<E extends Entity, P extends Entity> {
    constructor() {
    }

    get(target: List<E, P>, property: string | number) {
        if (Number.isInteger(Number(property.toString()))) {
            return target.items[property as number]
        }
        return target[property as keyof List<E, P>]
    }
}
