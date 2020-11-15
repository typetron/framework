import { Query } from './Query'
import { Entity } from './Entity'
import { DotNotationProperties, EntityConstructor, EntityObject, Expression } from './index'
import { KeysOfType } from '../Support'
import { BelongsTo, BelongsToMany, HasMany, HasOne } from './Fields'
import { BaseRelationship } from './ORM/BaseRelationship'

export class EntityQuery<T extends Entity> extends Query<T> {

    // tslint:disable-next-line:no-any
    private eagerLoad: (string | [string, (query: EntityQuery<any>) => void])[] = []
    private eagerLoadCount: string[] = []

    constructor(public entity: EntityConstructor<T>) {
        super()
    }

    async get<K extends keyof T>(...columns: (K | string | Expression)[]): Promise<T[]> {
        let entities = await super.get(...columns)

        entities = this.entity.hydrate(this.entity, entities, true)

        entities = await this.eagerLoadRelationships(entities)

        return await this.eagerLoadRelationshipsCounts(entities)
    }

    public async eagerLoadRelationships(entities: T[]) {
        await this.eagerLoad.forEachAsync(async (field) => {
            // tslint:disable-next-line:no-any
            let fieldName: string, fieldQueryFunction: undefined | ((query: EntityQuery<any>) => void)
            if (field instanceof Array) {
                fieldName = field[0]
                fieldQueryFunction = field[1]
            } else {
                fieldName = field
            }
            const [first, ...rest] = fieldName.split('.')
            const relation = this.entity.metadata.allRelationships[first]
            const results = await relation.getRelatedValue(entities, rest.join('.'), fieldQueryFunction as (query: Query) => void)
            if (results.length) {
                entities = relation.match(entities, results) as T[]
            }
        })
        return entities
    }

    public async eagerLoadRelationshipsCounts(entities: T[]) {
        await this.eagerLoadCount.forEachAsync(async (field) => {
            const relation = this.entity.metadata.allRelationships[field]
            const results = await relation.getRelatedCount(entities)
            if (results.length) {
                entities = relation.matchCounts(entities, results) as T[]
            }
        })
        return entities
    }

    async first<K extends keyof T>(...columns: (K | string | Expression)[]): Promise<T | undefined> {
        const entityData = await super.first(...columns)
        if (!entityData) {
            return undefined
        }
        let entity = this.entity.new(entityData, true)

        entity = (await this.eagerLoadRelationships([entity])).first()

        return (await this.eagerLoadRelationshipsCounts([entity])).first()
    }

    async firstOrNew<K extends keyof T>(
        // tslint:disable-next-line:no-any
        properties: Partial<EntityObject<T> | Record<string, any>>,
        values?: Partial<EntityObject<T>>
    ): Promise<T> {
        Object.entries(properties).forEach(([property, value]) => {
            const field = this.entity.metadata.columns[property] || this.entity.metadata.relationships[property]
            this.andWhere(field.column, value instanceof Entity ? value[value.getPrimaryKey()] : value)
        })
        const instance = await this.first()
        if (!instance) {
            return new this.entity({...properties, ...values})
        }
        instance.exists = true
        return instance
    }

    with(
        ...relations: (
            // tslint:disable-next-line:no-any
            KeysOfType<T, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>> | DotNotationProperties<this> |
            // tslint:disable-next-line:no-any max-line-length
            [KeysOfType<T, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>> | DotNotationProperties<this>, (query: EntityQuery<any>) => void]
            )[]
    ) {
        relations = relations.filter(Boolean)
        if (relations.length) {
            // tslint:disable-next-line:no-any
            this.eagerLoad = this.eagerLoad.concat(relations as string | [string, (query: EntityQuery<any>) => void])
        }

        return this
    }

    withCount<K extends KeysOfType<T, BaseRelationship<Entity>>>(...relations: K[]) {
        this.eagerLoadCount = this.eagerLoadCount.concat(relations as string[])

        return this
    }
}
