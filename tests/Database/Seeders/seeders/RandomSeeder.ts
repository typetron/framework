import { Query } from "@Typetron/Database";
import { Seeder } from "@Typetron/Database/Seeders";

export class RandomSeeder extends Seeder{
    public run(): void {
        Query.table('random_table').insertOne({
            col1: 'val1'
        })
    }
}