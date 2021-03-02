export interface Authenticatable {
    getId(): number | string;

    getUsername(): string;

    getPassword(): string;
}
