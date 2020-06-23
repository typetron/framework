import {Connection} from '../Database/Connection';

export interface Migration {
    up (connection: Connection): Promise<any>;

    down (connection: Connection): Promise<any>;
}