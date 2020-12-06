import { compare, hash } from 'bcrypt'

export class Crypt {
    static hash(value: string, saltRounds: number): Promise<string> {
        return hash(value, saltRounds)
    }

    static compare(value: string, encrypted: string): Promise<boolean> {
        return compare(value, encrypted)
    }
}
