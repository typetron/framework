import { Abstract, Constructor } from '../Support';

export type ServiceIdentifier<T> = (string | Constructor<T> | Abstract<T> | Symbol);
