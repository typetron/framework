import { RuleValue } from '.';

export interface Rule {
    passes(attribute: string, value: RuleValue): boolean;

    message(attribute: string, value: RuleValue): string;
}

