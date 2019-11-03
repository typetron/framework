import { BaseConfig } from './Config/BaseConfig';

export class AuthConfig extends BaseConfig<AuthConfig>('auth') {
    signature: string;
    duration: number;
}
