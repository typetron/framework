import { RuleInterface, RuleValue } from '..';
import { Rule } from '../Rule';
import { Type } from '../../Support';

export function MaxLength(max: number): Type<RuleInterface> {
    return class extends Rule {
        identifier = 'maxLength';

        passes(attribute: string, value: RuleValue): boolean {
            return Boolean(value && String(value).length <= max);
        }

        message(attribute: string): string {
            return `The ${attribute} must have at most ${max} characters`;
        }
    };
}
