import { RuleValue } from '..';
import { Rule } from '../Rule';

export class Required extends Rule {
    identifier = 'required';

    passes(attribute: string, value: RuleValue): boolean {
        return !!value;
    }

    message(attribute: string): string {
        return `The ${attribute} is required`;
    }
}
