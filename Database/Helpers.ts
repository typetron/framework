/**
 * Quotes identifiers with backticks. Dotted names are quoted per part and already quoted parts are kept,
 * so `wrap('users.id')` gives `users`.`id`. Drivers that quote differently translate backticks themselves.
 */
export function wrap(strings: string | string[]) {
    if (typeof strings === 'string') {
        strings = [strings]
    }
    return strings.map(column => column.split('.').map(wrapPart).join('.')).join(', ')
}

function wrapPart(part: string) {
    if (!part || part === '*' || /^`.*`$/.test(part)) {
        return part
    }
    return '`' + part + '`'
}
