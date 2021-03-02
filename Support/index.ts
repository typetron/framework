import './Array'
import './String'
import './Math'

export type KeysOfType<T, Condition> = { [P in keyof T]: T[P] extends Condition ? P : never }[keyof T];
export type ChildKeys<Child, Parent> = Exclude<keyof Child, keyof Parent>;
export type ChildObject<Child, Parent> = Omit<Child, keyof Parent>;

// tslint:disable-next-line:no-any
export type Type<T> = new(...args: any[]) => T;

export interface Abstract<T> {
    prototype: T;
}

// tslint:disable-next-line:no-any
export type Constructor<T = {}> = new(...args: any[]) => T;
