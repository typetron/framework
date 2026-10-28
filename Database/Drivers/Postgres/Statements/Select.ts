import { Select as BaseSelect } from '../../SQL/Statements/Select'

export class Select extends BaseSelect {
    get limit() {
        const limit = this.components.limit
        if (!limit) {
            return ''
        }
        return limit.count ? `LIMIT ${limit.count} OFFSET ${limit.from}` : `LIMIT ${limit.from}`
    }
}
