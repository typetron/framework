import { BaseConfig } from './Config/BaseConfig';
import { User } from './Auth';

export class AuthConfig extends BaseConfig<AuthConfig>('auth') {
    entity: typeof User;
    signature: string;
    duration: number;
    saltRounds: number;
}
