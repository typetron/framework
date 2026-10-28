/**
 * Translates the shared SQL dialect to Postgres: backtick identifiers become double-quoted
 * and `?` placeholders become `$1`, `$2`, ... Quoted literals and identifiers are left untouched.
 */
export function toPostgresSQL(sql: string) {
    let placeholder = 0
    let quote: string | undefined
    let result = ''

    for (const char of sql) {
        if (quote) {
            quote = char === quote ? undefined : quote
            result += char
        } else if (char === '\'' || char === '"') {
            quote = char
            result += char
        } else if (char === '`') {
            result += '"'
        } else if (char === '?') {
            result += '$' + ++placeholder
        } else {
            result += char
        }
    }

    return result
}
