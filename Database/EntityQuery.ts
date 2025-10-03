import { Query } from './Query'
import { Entity } from './Entity'
import { DotNotationProperties, EntityConstructor, EntityObject, StringExpression } from './index'
import { KeysOfType } from '@Typetron/Support'
import { BelongsTo, BelongsToMany, HasMany, HasOne } from './Fields'
import { List } from './List'
import { RelationsTree, RelationsTreeQuery } from './Types'

export class EntityQuery<T extends Entity> extends Query<T> {

    // tslint:disable-next-line:no-any
    eagerLoad: (string | [string, RelationsTreeQuery])[] = []
    // tslint:disable-next-line:no-any
    eagerLoadCount: (string | [string, RelationsTreeQuery])[] = []

    constructor(public entity: EntityConstructor<T>) {
        super()
    }

    async get<K extends keyof T>(...columns: (K | string | StringExpression)[]): Promise<T[]> {
        let entities = await super.get(...columns)

        entities = this.entity.hydrate(this.entity, entities, true)

        entities = await this.eagerLoadRelationships(entities)

        return await this.eagerLoadRelationshipsCounts(entities)
    }

    public async eagerLoadRelationships(entities: T[]) {

        const relationsTree = this.tree(this.eagerLoad)

        await Object.keys(relationsTree).forEachAsync(async (relationName) => {
            const relationValue = relationsTree[relationName]
            const relation = this.entity.metadata.allRelationships[relationName]

            if (!relation) {
                throw new Error(`Relation '${relationName}' doesn't not exist on entity '${this.entity.name}'`)
            }

            // tslint:disable-next-line:no-any
            let fieldQueryFunction: undefined | RelationsTreeQuery
            let otherRelations: this['eagerLoad'] = []
            if (relationValue instanceof Function) {
                fieldQueryFunction = relationValue
            } else {
                otherRelations = this.treeBack(relationValue)
            }

            const results = await relation.getRelatedValue(entities, otherRelations, fieldQueryFunction as (query: Query) => void)

            // if (results.length) {
                entities = relation.match(entities, results) as T[]
            // }
        })
        // await this.eagerLoad.forEachAsync(async (field) => {
        //     // tslint:disable-next-line:no-any
        //     let fieldName: string, fieldQueryFunction: undefined | RelationsTreeQuery
        //     if (field instanceof Array) {
        //         fieldName = field[0]
        //         fieldQueryFunction = field[1]
        //     } else {
        //         fieldName = field
        //     }
        //     const [first, ...rest] = fieldName.split('.')
        //     const relation = this.entity.metadata.allRelationships[first]
        //     const results = await relation.getRelatedValue(entities, [rest.join('.')], fieldQueryFunction as (query: Query) => void)
        //     if (results.length) {
        //         entities = relation.match(entities, results) as T[]
        //     }
        // })
        return entities
    }

    public async eagerLoadRelationshipsCounts(entities: T[]) {
        await this.eagerLoadCount.forEachAsync(async (field) => {
            // tslint:disable-next-line:no-any
            let fieldName: string, fieldQueryFunction: undefined | RelationsTreeQuery
            if (field instanceof Array) {
                fieldName = field[0]
                fieldQueryFunction = field[1]
            } else {
                fieldName = field
            }

            const relation = this.entity.metadata.allRelationships[fieldName]
            const results = await relation.getRelatedCount(entities, fieldQueryFunction as ((query: Query) => void))
            if (results.length) {
                entities = relation.matchCounts(entities, results) as T[]
            }
        })
        return entities
    }

    async first<K extends keyof T>(...columns: (K | string | StringExpression)[]): Promise<T | undefined> {
        const entityData = await super.first(...columns)
        if (!entityData) {
            return undefined
        }
        let entity = this.entity.new(entityData, true)

        entity = (await this.eagerLoadRelationships([entity])).first() as T

        return (await this.eagerLoadRelationshipsCounts([entity])).first()
    }

    async firstOrNew<K extends keyof T>(
        // tslint:disable-next-line:no-any
        properties: Partial<EntityObject<T> | Record<string, any>>,
        values?: Partial<EntityObject<T>>
    ): Promise<T> {
        Object.entries(properties).forEach(([property, value]) => {
            const field = this.entity.metadata.columns[property] || this.entity.metadata.relationships[property]
            const finalValue = value instanceof Entity ? value[value.getPrimaryKey()] : value
            if (finalValue === undefined) {
                this.andWhereNull(field.column)
            } else {
                this.andWhere(field.column, finalValue)
            }
        })
        const instance = await this.first()
        if (!instance) {
            return this.entity.new({...properties, ...values})
        }
        instance.exists = true
        return instance
    }

    with(
        ...relations: (
            // tslint:disable-next-line:no-any
            KeysOfType<T, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>> | DotNotationProperties<this> |
            // tslint:disable-next-line:no-any max-line-length
            [KeysOfType<T, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>> | DotNotationProperties<this>, RelationsTreeQuery]
            )[]
    ) {
        relations = relations.filter(Boolean)
        if (relations.length) {
            // tslint:disable-next-line:no-any
            this.eagerLoad = this.eagerLoad.concat(relations as string | [string, RelationsTreeQuery]).unique()
        }

        return this
    }

    withCount<K extends KeysOfType<T, List<Entity>>>(
        ...relations: (
            // tslint:disable-next-line:no-any
            KeysOfType<T, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>> | DotNotationProperties<this> |
            // tslint:disable-next-line:no-any max-line-length
            [KeysOfType<T, BelongsTo<any> | HasOne<any> | HasMany<any> | BelongsToMany<any>> | DotNotationProperties<this>, RelationsTreeQuery]
            )[]
    ) {
        // @ts-ignore
        this.eagerLoadCount = this.eagerLoadCount.concat(relations)

        return this
    }

    private tree(relations: this['eagerLoad']) {
        const tree: RelationsTree = {}

        relations.forEach(relation => {
            let relationName: string
            let relationValue: RelationsTreeQuery | {} = {}
            if (relation instanceof Array) {
                relationName = relation[0]
                relationValue = relation[1]
            } else {
                relationName = relation
            }

            let container = tree
            const relationStringParts = relationName.split('.')
            relationStringParts.forEach((part, index) => {
                const value = index === relationStringParts.length - 1 ? relationValue : {}
                // @ts-ignore
                container = (container[part] ? container[part] : container[part] = value)
            })
        })

        return tree
    }

    private treeBack(relationsTree: RelationsTree): this['eagerLoad'] {
        return Object.keys(relationsTree).map(relationName => {
            const item = relationsTree[relationName]

            if (item instanceof Function) {
                return [relationName, item]
            } else {
                return [relationName, this.treeBack(item)].filter(Boolean).join('.')
            }
        })
    }
}
