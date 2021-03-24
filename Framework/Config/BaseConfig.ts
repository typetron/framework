import { ChildObject } from '../../Support'

export class BaseConfig<T> {
    constructor(private newValues: Partial<ChildObject<T, BaseConfig<T>>>) {}

    applyNewValues() {
        Object.assign(this, this.newValues)
    }
}
