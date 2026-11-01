import { Entity } from '../../Entity'
import { JSONField, PrimaryField, TextField } from '../../Fields'

// tslint:disable-next-line:no-any
export const typesMatches = new Map<any, string>([
    [Entity, 'integer'],
    [PrimaryField, `integer`],
    [Number, 'integer'],
    [String, 'varchar(255)'],
    [Date, 'datetime'],
    [JSONField, 'text'],
    [TextField, 'text'],
    [Boolean, 'integer'],
])
