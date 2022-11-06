export function wrap(strings: string | string[]) {
    if (typeof strings === 'string') {
        strings = [strings]
    }
    return strings.map(column => {
        // // Only add backticks for columns that contain characters outside the following set
        // if (/^[0-9,a-z,A-Z$_]+$/.test(column)) {
        //     return column
        // }
        return '`' + column + '`'
    }).join(', ')
}
