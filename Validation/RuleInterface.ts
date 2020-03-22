import { RuleValue } from '.';

export interface RuleInterface {
    identifier: string;

    passes(attribute: string, value: RuleValue): boolean;

    message(attribute: string, value: RuleValue): string;
}

