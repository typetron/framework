import { Column, Entity, ID } from "../Database";

export class Migration extends Entity {

    @Column()
    id: ID;

    @Column()
    name: string;

    @Column()
    batch: number;
}