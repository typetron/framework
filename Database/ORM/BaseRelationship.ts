import { Entity } from '../Entity'
import { InverseRelationship, RelationshipField } from '../Fields'

export abstract class BaseRelationship<E extends Entity, P extends Entity = Entity> {
    constructor(
        public relationship: RelationshipField<P, E> | InverseRelationship<P, E>,
        public parent: P
    ) {
    }
}
