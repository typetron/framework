export class StorageError extends Error {}

export class StorageDiskNotFound extends StorageError {
    constructor(name: string) {
        super(`Storage disk '${name}' is not configured.`)
    }
}

export class StorageDriverNotSupported extends StorageError {
    constructor(name: string) {
        super(`Storage driver '${name}' is not supported.`)
    }
}

export class StorageFileNotFound extends StorageError {
    constructor(key: string) {
        super(`Storage file '${key}' was not found.`)
    }
}

export class InvalidStorageKey extends StorageError {
    constructor(key: string) {
        super(`Storage key '${key}' is invalid.`)
    }
}

export class UnsupportedStorageOperation extends StorageError {
    constructor(operation: string) {
        super(`The storage driver does not support '${operation}'.`)
    }
}

export class ReadOnlyStorage extends StorageError {
    constructor() {
        super('The storage disk is read-only.')
    }
}
