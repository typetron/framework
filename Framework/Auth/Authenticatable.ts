import { Entity, EntityColumns } from '../../Database'

export interface Authenticatable<T extends Entity> {
    getId(): EntityColumns<T>;

    getUsername(): EntityColumns<T>;

    getPassword(): EntityColumns<T>;
}
