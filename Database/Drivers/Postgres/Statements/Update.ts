import { Update as BaseUpdate } from '../../SQL/Statements/Update'
import { rejectLimit } from './rejectLimit'

export class Update extends BaseUpdate {
    get limit() {
        return rejectLimit(this.components, 'UPDATE')
    }

    get orders() {
        return ''
    }
}
