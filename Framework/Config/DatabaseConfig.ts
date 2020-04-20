import { BaseConfig } from './BaseConfig';

export class DatabaseConfig extends BaseConfig<DatabaseConfig>('database') {
    database?: string;
}
