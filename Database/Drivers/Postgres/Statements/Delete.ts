import { Delete as BaseDelete } from '../../SQL/Statements/Delete'
import { rejectLimit } from './rejectLimit'

export class Delete extends BaseDelete {
    get limit() {
        return rejectLimit(this.components, 'DELETE')
    }

    get orders() {
        return ''
    }
}
