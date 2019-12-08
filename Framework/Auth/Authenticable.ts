export interface Authenticable {
    getId(): number | string;

    getUsername(): string;

    getPassword(): string;
}
