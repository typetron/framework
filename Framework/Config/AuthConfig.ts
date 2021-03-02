import { User } from '../Auth'
import { BaseConfig } from './BaseConfig'

export class AuthConfig extends BaseConfig<AuthConfig> {
    entity: typeof User
    signature: string
    duration: number
    saltRounds: number
}
