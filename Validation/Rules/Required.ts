import { RuleInterface, RuleValue } from '..'
import { Type } from '@Typetron/Support'

export function Required(message?: string): Type<RuleInterface> {
    return class {
        identifier = 'required'

        passes(attribute: string, value: RuleValue): boolean {

            if (value === undefined || value === null) {
                return false
            }

            if (typeof value === 'string' && value.trim() === '') {
                return false
            }

            if (value.constructor === Array && value.length === 0) {
                return false
            }

            return true
        }

        message(attribute: string): string {
            return message ?? `The ${attribute} is required`
        }
    }
}
