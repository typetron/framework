import { RuleValue } from '.';

export interface RuleInterface {
    passes(attribute: string, value: RuleValue): boolean;

    message(attribute: string, value: RuleValue): string;
}

