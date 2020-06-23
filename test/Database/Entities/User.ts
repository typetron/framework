import { Column, CreatedAt, Entity, BelongToMany, Meta, HasMany, HasOne, UpdatedAt, PrimaryColumn } from '../../../Database';
import { Article } from './Article';
import { Role } from './Role';
import { Profile } from './Profile';
import { List } from '../../../Database/List';

@Meta({
    table: 'users'
})
export class User extends Entity {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    email: string;

    @HasOne(() => Profile, 'user')
    profile: Profile;

    @HasMany(() => Article, 'author')
    articles: List<Article>;

    @BelongToMany(() => Role, 'users')
    roles: List<Role>;

    @CreatedAt()
    createdAt: Date;

    @UpdatedAt()
    updatedAt: Date;
}
