import { Constructor, Type } from '../Support'
import { RuleInterface } from '../Validation'

export class FormField {
    constructor(
        public name: string,
        // tslint:disable-next-line:no-any
        public type: any,
        // tslint:disable-next-line:no-any
        public rules: (Type<RuleInterface> | ((...args: any[]) => Type<RuleInterface>)) [] = []
    ) {
    }

    // tslint:disable-next-line:no-any
    validate(value: any): Record<string, string> | undefined {
        const errors: Record<string, string> = {}
        let hasErrors = false
        this.rules.forEach(rule => {
            if (!rule.prototype.passes) {
                rule = (rule as Function)()
            }
            const instance = new (rule as Constructor<RuleInterface>)
            if (!instance.passes(this.name, value)) {
                hasErrors = true
                errors[instance.identifier] = instance.message(this.name, value)
            }
        })

        return hasErrors ? errors : undefined
    }
}
