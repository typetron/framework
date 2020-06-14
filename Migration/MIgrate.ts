import { Column, Entity, ID } from "../Database";

export class Migrate extends Entity {

    @Column()
    id: ID;

    @Column()
    name: string;

    @Column()
    batch: number;
}