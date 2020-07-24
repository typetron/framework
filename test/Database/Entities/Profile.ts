import { Column, CreatedAt, Entity, PrimaryColumn, Relation, UpdatedAt } from '../../../Database';
import { User } from './User';
import { BelongsTo } from '../../../Database/Fields';

export class Profile extends Entity {

    @PrimaryColumn()
    id: number;

    @Relation(() => User, 'profile')
    user: BelongsTo<User>;

    @Column()
    address: string;

    @CreatedAt()
    createdAt: Date;

    @UpdatedAt()
    updatedAt: Date;
}
