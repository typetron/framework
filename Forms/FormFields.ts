import { Constructor, Type } from '../Support';
import { RuleInterface } from '../Validation';
import { Rule } from '../Validation/Rule';

export class FormField {
    // tslint:disable-next-line:no-any
    constructor(public name: string, public type: any, public rules: (Type<RuleInterface> | RuleInterface) [] = []) {}

    // tslint:disable-next-line:no-any
    validate(value: any): Record<string, string> | undefined {
        const errors: Record<string, string> = {};
        let hasErrors = false;
        this.rules.forEach(rule => {
            if (!(rule instanceof Rule)) {
                rule = new (rule as Constructor<RuleInterface>);
            }
            if (!rule.passes(this.name, value)) {
                hasErrors = true;
                errors[rule.identifier] = rule.message(this.name, value);
            }
        });

        return hasErrors ? errors : undefined;
    }
}
