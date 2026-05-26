import { Entity } from './Entity'
import { EntityKeys } from './index'
import { EntityQuery } from './EntityQuery'
import { BooleanOperator, Operator, WhereValue } from './Types'
import { BelongsToManyField, HasManyField } from './Fields'
import { BaseRelationship as Relationship } from './ORM/BaseRelationship'
import { ID } from './Decorators'
import { EntityNotFoundError } from './EntityNotFoundError'

export abstract class List<E extends Entity, P extends Entity = Entity> extends Relationship<E, P> implements Iterable<E>, ArrayLike<E> {

    items: E[] = []

    declare public relationship: HasManyField<P, E> | BelongsToManyField<P, E>

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
        boolean?: BooleanOperator
    ): EntityQuery<E> {
        return this.relationship.getQuery(this.parent).where(column, operator, value, boolean)
    }

    async find(key: ID): Promise<E | undefined> {
        const primaryKey = this.relationship.type().getPrimaryKey()

        return this.where(primaryKey, key).first()
    }

    async findOrFail(key: ID): Promise<E> {
        const entity = this.relationship.type()
        const instance = await this.find(key)

        if (!instance) {
            throw new EntityNotFoundError(entity, `No records found for entity '${entity.name}' when querying with parameters [${key}]`)
        }

        return instance
    }

    toJSON() {
        return this.items
    }
}

export class ListProxyHandler<E extends Entity, P extends Entity> {
    get(target: List<E, P>, property: string | symbol) {
        if (Number.isInteger(Number(property.toString()))) {
            return target.items[property as unknown as number]
        }
        return target[property as keyof List<E, P>]
    }
}
