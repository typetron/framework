import './Array';
import './String';
import './Math';

export type KeysOfType<T, Condition> = { [P in keyof T]: T[P] extends Condition ? P : never }[keyof T];
export type ChildKeys<Child, Parent> = Exclude<keyof Child, keyof Parent>;
export type ChildObject<Child, Parent> = Partial<Omit<Child, keyof Parent>>;

export interface Type<T> extends Function {
    // @ts-ignore
    new(...args): T;
}

export interface Abstract<T> {
    prototype: T;
}

export interface Constructor<T = {}> {
    // @ts-ignore
    new(...args): T;
}
