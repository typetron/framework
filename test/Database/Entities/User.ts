import { Column, CreatedAt, Entity, Meta, PrimaryColumn, Relation, UpdatedAt } from '../../../Database';
import { Article } from './Article';
import { Role } from './Role';
import { Profile } from './Profile';
import { BelongsToMany, HasMany, HasOne } from '../../../Database/Fields';

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

    @Relation(() => Profile, 'user')
    profile: HasOne<Profile>;

    @Relation(() => Article, 'author')
    articles: HasMany<Article>;

    @Relation(() => Role, 'users')
    roles: BelongsToMany<Role>;

    @CreatedAt()
    createdAt: Date;

    @UpdatedAt()
    updatedAt: Date;
}
