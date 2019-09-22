import { Rule } from '../Rule';
import { RuleValue } from '..';

export class Required implements Rule {
    passes(attribute: string, value: RuleValue): boolean {
        return !!value;
    }

    message(attribute: string): string {
        return `The field '${attribute}' is required`;
    }

}
