declare module 'fast-url-parser' {
    export function parse(url: string): Url

    type Url = URL & {
        format(): string
        query: string
    }
}
