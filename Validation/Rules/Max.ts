import { RuleInterface, RuleValue } from '..';
import { Rule } from '../Rule';
import { Type } from '../../Support';

export function Max(max: number): Type<RuleInterface> {
    return class extends Rule {
        passes(attribute: string, value: RuleValue): boolean {
            return Boolean(value && String(value).length <= max);
        }

        message(attribute: string): string {
            return `The attribute '${attribute}' must have at most ${max} characters`;
        }
    };
}
