export function wrap(strings: string | string[]) {
    if (typeof strings === 'string') {
        return '`' + strings + '`';
    }
    return strings.map(column => '`' + column + '`').join(', ');
}
