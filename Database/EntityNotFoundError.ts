import { Entity } from './Entity'

export class EntityNotFoundError extends Error {
    constructor(public entity: typeof Entity, message: string) {super(message)}
}
