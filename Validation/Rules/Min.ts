import { RuleInterface } from '../RuleInterface';
import { RuleValue } from '..';
import { Type } from '../../Support';
import { Rule } from '../Rule';

export function Min(min: number): Type<RuleInterface> {
    return class extends Rule {
        passes(attribute: string, value: RuleValue): boolean {
            return Boolean(value && String(value).length >= min);
        }

        message(attribute: string): string {
            return `The '${attribute}' must have at least ${min} characters`;
        }
    };
}
