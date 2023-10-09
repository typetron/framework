import { RuleInterface, RuleValue } from '..'
import { Rule } from '../Rule'
import { Type } from '@Typetron/Support'

export function Optional(): Type<RuleInterface> {
    return class extends Rule {
        identifier = 'optional'

        passes(attribute: string, value: RuleValue): boolean {
            return true // TODO
        }

        message(attribute: string): string {
            return ''
        }
    }
}

