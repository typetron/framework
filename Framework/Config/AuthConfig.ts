import { User } from '../Auth'
import { BaseConfig } from './BaseConfig'
import { EntityKeys } from '@Typetron/Database'

export class AuthConfig<T extends User> extends BaseConfig<AuthConfig<T>> {
    entity: typeof User
    signature: string
    duration: number
    saltRounds: number
    identityColumn: EntityKeys<T>
}
