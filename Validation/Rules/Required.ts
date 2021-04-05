import { RuleInterface, RuleValue } from '..'
import { Rule } from '../Rule'
import { Type } from '@Typetron/Support'

export function Required(message?: string): Type<RuleInterface> {
    return class extends Rule {
        identifier = 'required'

        passes(attribute: string, value: RuleValue): boolean {
            return !!value
        }

        message(attribute: string): string {
            return message ?? `The ${attribute} is required`
        }
    }
}
