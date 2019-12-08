import { RuleValue } from '..';
import { Rule } from '../Rule';

export class Required extends Rule {
    passes(attribute: string, value: RuleValue): boolean {
        return !!value;
    }

    message(attribute: string): string {
        return `The field '${attribute}' is required`;
    }
}
