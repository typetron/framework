import { Entity } from '../Entity';
import { ChildObject } from '../../Support';
import { InverseRelationship, Relationship } from '../Fields';

export abstract class RelationClass<E extends Entity, P extends Entity = Entity> {
    constructor(
        public relationship: Relationship<E, P> | InverseRelationship<E, P>,
        public parent: P
    ) {
    }

    abstract async save(data?: ChildObject<this, Entity> | {}): Promise<E | E[] | undefined>;
}
