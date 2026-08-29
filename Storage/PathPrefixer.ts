import path from 'node:path'
import { InvalidStorageKey } from './errors'

export class PathPrefixer {
    private readonly prefixValue: string

    constructor(prefix = '') {
        this.prefixValue = this.normalize(prefix, true)
    }

    normalize(key: string, allowEmpty = false): string {
        if (key.includes('\0')) {
            throw new InvalidStorageKey(key)
        }

        const normalized = key.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '').replace(/\/{2,}/g, '/')
        const segments = normalized.split('/')
        if (segments.includes('..') || (!allowEmpty && !normalized)) {
            throw new InvalidStorageKey(key)
        }
        return normalized
    }

    prefix(key: string, allowEmpty = false): string {
        const normalized = this.normalize(key, allowEmpty)
        return [this.prefixValue, normalized].filter(Boolean).join('/')
    }

    stripPrefix(key: string): string {
        const normalized = this.normalize(key, true)
        if (!this.prefixValue) {
            return normalized
        }
        if (normalized === this.prefixValue) {
            return ''
        }
        if (!normalized.startsWith(`${this.prefixValue}/`)) {
            throw new InvalidStorageKey(key)
        }
        return normalized.slice(this.prefixValue.length + 1)
    }

    resolve(root: string, key: string): string {
        const normalized = this.prefix(key)
        const resolvedRoot = path.resolve(root)
        const resolved = path.resolve(resolvedRoot, ...normalized.split('/'))
        if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
            throw new InvalidStorageKey(key)
        }
        return resolved
    }
}
