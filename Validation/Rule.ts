import { RuleInterface } from './RuleInterface';

export abstract class Rule implements RuleInterface {
    abstract message(attribute: string, value: string | number | {} | boolean | undefined): string;

    abstract passes(attribute: string, value: string | number | {} | boolean | undefined): boolean ;
}
