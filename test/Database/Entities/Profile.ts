import { Column, CreatedAt, Entity, BelongToMany, Meta, HasMany, HasOne, UpdatedAt, BelongsTo, PrimaryColumn } from '../../../Database';
import { Article } from './Article';
import { Role } from './Role';
import { User } from './User';

export class Profile extends Entity {

    @PrimaryColumn()
    id: number;

    @BelongsTo(() => User, 'profile')
    user: User;

    @Column()
    address: string;

    @CreatedAt()
    createdAt: Date;

    @UpdatedAt()
    updatedAt: Date;
}
