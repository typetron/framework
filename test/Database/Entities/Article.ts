import { Column, Entity, BelongsTo, PrimaryColumn } from '../../../Database';
import { User } from './User';

export class Article extends Entity {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    content: string;

    @Column()
    published = false;

    @BelongsTo(() => User, 'articles')
    author: User;
}
