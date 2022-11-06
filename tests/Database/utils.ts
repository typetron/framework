import { Expression } from '@Typetron/Database'
import { expect } from 'chai'

export function expectQuery(expression: Expression | string) {
    const sql = expression instanceof Expression ? expression.toSQL() : expression

    return {
        toEqual: (expected: string) => {
            expect(trimSQL(sql)).to.be.equal(trimSQL(expected))
        }
    }
}

export function trimSQL(sql: string) {
    return sql.replace(/(\r\n|\n|\r)/gm, ' ').replace(/`/gm, '').replace(/  +/g, ' ').trim()
}
