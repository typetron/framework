import { Rule } from './Rule';
import { Type } from '../Support';

export abstract class Validator<T> {
    protected constructor(public data: T, public rules: { [key in keyof T]?: (Rule | Type<Rule>)[] }) {
    }
}
