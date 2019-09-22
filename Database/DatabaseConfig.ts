import { BaseConfig } from '../Framework/Config/BaseConfig';

export class DatabaseConfig extends BaseConfig<DatabaseConfig>('database') {
    database: string;
}
