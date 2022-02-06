import { Connection } from "..";

export abstract class Seed {
    constructor(protected connection: Connection){}
    
    public abstract run():void
}