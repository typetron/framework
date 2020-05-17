import { BaseConfig } from './BaseConfig';

export class DatabaseConfig extends BaseConfig<DatabaseConfig> {
    database?: string;
    synchronizeSchema = false;
    entities: string;
}
