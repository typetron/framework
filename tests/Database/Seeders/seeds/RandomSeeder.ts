import { Query } from "@Typetron/Database";
import { Seed } from "@Typetron/Database/Seeders";

export class RandomSeeder extends Seed{
    public run(): void {
        Query.table('random_table').insertOne({
            col1: 'val1'
        })
    }
}