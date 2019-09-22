import { Rule } from '../Rule';
import { RuleValue } from '..';

export class Max implements Rule {
    constructor(public max: number) {

    }

    passes(attribute: string, value: RuleValue): boolean {
        return Boolean(value && String(value).length <= this.max);
    }

    message(attribute: string): string {
        return `The attribute '${attribute}' must have at most ${this.max} characters`;
    }
}
