import { Rule } from '../Rule';
import { RuleValue } from '..';

export class Min implements Rule {
    constructor(public min: number) {

    }

    passes(attribute: string, value: RuleValue): boolean {
        return Boolean(value && String(value).length >= this.min);
    }

    message(attribute: string): string {
        return `The '${attribute}' must have at least ${this.min} characters`;
    }
}
