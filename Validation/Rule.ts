import { RuleInterface } from './RuleInterface'

export abstract class Rule implements RuleInterface {
    abstract identifier: string

    abstract message(attribute: string, value: string | number | object | boolean | undefined): string;

    abstract passes(attribute: string, value: string | number | object | boolean | undefined): boolean ;
}
