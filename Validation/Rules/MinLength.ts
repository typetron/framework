import { RuleInterface } from '../RuleInterface';
import { RuleValue } from '..';
import { Type } from '../../Support';
import { Rule } from '../Rule';

export function MinLength(min: number): Type<RuleInterface> {
    return class extends Rule {
        identifier = 'minLength';

        passes(attribute: string, value: RuleValue): boolean {
            return Boolean(value && String(value).length >= min);
        }

        message(attribute: string): string {
            return `The ${attribute} must have at least ${min} characters`;
        }
    };
}
