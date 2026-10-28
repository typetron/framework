import { Schema as BaseSchema } from '../SQL/Schema'
import { typesMatches } from '.'

export class Schema extends BaseSchema {
    protected typesMatches = typesMatches
}
