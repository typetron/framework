import { Column, Entity, PrimaryColumn, Relation } from '../../../Database'
import { User } from './User'
import { BelongsTo } from '../../../Database/Fields'

export class Article extends Entity {

    @PrimaryColumn()
    id: number

    @Column()
    title: string

    @Column()
    content: string;

    @Column()
    published: boolean = false

    @Relation(() => User, 'articles')
    author: BelongsTo<User>;
}
