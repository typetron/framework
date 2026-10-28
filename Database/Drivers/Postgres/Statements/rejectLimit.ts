import { Components } from '../../../Types'

/** Postgres has no LIMIT on UPDATE or DELETE; failing beats silently affecting every matching row */
export function rejectLimit(components: Components, statement: string): string {
    if (components.limit) {
        throw new Error(`Postgres does not support LIMIT in ${statement} statements`)
    }
    return ''
}
