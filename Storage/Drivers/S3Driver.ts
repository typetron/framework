import { Readable } from 'node:stream'
import { StorageDriver } from '../StorageDriver'
import { PathPrefixer } from '../PathPrefixer'
import { StorageFileNotFound } from '../errors'
import {
    FileMetadata,
    ListOptions,
    S3DiskConfig,
    StorageContent,
    StorageEntry,
    TemporaryUrlOptions,
    Visibility,
    WriteOptions,
} from '../types'

interface S3ClientLike {
    send(command: any): Promise<any>
}

export class S3Driver extends StorageDriver {
    private readonly prefixer: PathPrefixer
    private client?: S3ClientLike

    constructor(private readonly config: S3DiskConfig, client?: unknown) {
        super()
        this.prefixer = new PathPrefixer(config.prefix)
        this.client = client as S3ClientLike | undefined
    }

    async write(key: string, content: StorageContent, options: WriteOptions = {}): Promise<void> {
        const {PutObjectCommand} = this.sdk()
        await this.getClient().send(new PutObjectCommand({
            Bucket: this.config.bucket,
            Key: this.key(key),
            Body: content,
            ACL: this.acl(options.visibility ?? this.config.visibility),
            ContentType: options.mimeType,
            Metadata: options.metadata,
            CacheControl: options.cacheControl,
            ContentDisposition: options.contentDisposition,
        }))
    }

    async read(key: string): Promise<Buffer> {
        const response = await this.getObject(key)
        if (!response.Body) {
            return Buffer.alloc(0)
        }
        if (typeof response.Body.transformToByteArray === 'function') {
            return Buffer.from(await response.Body.transformToByteArray())
        }
        const body = response.Body as Readable
        return Buffer.concat(await Array.fromAsync(body, chunk => Buffer.from(chunk)))
    }

    async readStream(key: string): Promise<Readable> {
        const response = await this.getObject(key)
        if (!response.Body) {
            return Readable.from([])
        }
        if (response.Body instanceof Readable) {
            return response.Body
        }
        if (typeof response.Body.transformToWebStream === 'function') {
            return Readable.fromWeb(response.Body.transformToWebStream() as never)
        }
        return Readable.from(response.Body as AsyncIterable<Uint8Array>)
    }

    async exists(key: string): Promise<boolean> {
        const {HeadObjectCommand} = this.sdk()
        try {
            await this.getClient().send(new HeadObjectCommand({Bucket: this.config.bucket, Key: this.key(key)}))
            return true
        } catch (error) {
            if (this.isMissing(error)) {
                return false
            }
            throw error
        }
    }

    async metadata(key: string): Promise<FileMetadata> {
        const {HeadObjectCommand} = this.sdk()
        try {
            const response = await this.getClient().send(new HeadObjectCommand({Bucket: this.config.bucket, Key: this.key(key)}))
            return {
                size: response.ContentLength,
                lastModified: response.LastModified,
                mimeType: response.ContentType,
                etag: response.ETag,
                metadata: response.Metadata,
            }
        } catch (error) {
            if (this.isMissing(error)) {
                throw new StorageFileNotFound(key)
            }
            throw error
        }
    }

    async* list(prefix = '', options: ListOptions = {}): AsyncIterable<StorageEntry> {
        const {ListObjectsV2Command} = this.sdk()
        const keyPrefix = this.prefixer.prefix(prefix, true)
        let continuationToken: string | undefined
        do {
            const response = await this.getClient().send(new ListObjectsV2Command({
                Bucket: this.config.bucket,
                Prefix: keyPrefix ? `${keyPrefix.replace(/\/$/, '')}/` : undefined,
                Delimiter: options.recursive ? undefined : '/',
                ContinuationToken: continuationToken,
            }))
            for (const directory of response.CommonPrefixes ?? []) {
                if (directory.Prefix) {
                    yield {key: this.prefixer.stripPrefix(directory.Prefix.replace(/\/$/, '')), type: 'directory'}
                }
            }
            for (const object of response.Contents ?? []) {
                if (object.Key && object.Key !== keyPrefix) {
                    yield {
                        key: this.prefixer.stripPrefix(object.Key),
                        type: 'file',
                        size: object.Size,
                        lastModified: object.LastModified,
                        etag: object.ETag,
                    }
                }
            }
            continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
        } while (continuationToken)
    }

    async delete(key: string): Promise<void> {
        const {DeleteObjectCommand} = this.sdk()
        await this.getClient().send(new DeleteObjectCommand({Bucket: this.config.bucket, Key: this.key(key)}))
    }

    async deleteDirectory(prefix: string): Promise<void> {
        const {DeleteObjectsCommand} = this.sdk()
        this.prefixer.normalize(prefix)
        let batch: string[] = []
        for await (const entry of this.list(prefix, {recursive: true})) {
            if (entry.type !== 'file') {
                continue
            }
            batch.push(this.key(entry.key))
            if (batch.length === 1000) {
                await this.deleteBatch(batch, DeleteObjectsCommand)
                batch = []
            }
        }
        if (batch.length) {
            await this.deleteBatch(batch, DeleteObjectsCommand)
        }
    }

    async copy(source: string, destination: string): Promise<void> {
        const {CopyObjectCommand} = this.sdk()
        await this.getClient().send(new CopyObjectCommand({
            Bucket: this.config.bucket,
            CopySource: `${this.config.bucket}/${this.encodeKey(this.key(source))}`,
            Key: this.key(destination),
        }))
    }

    async move(source: string, destination: string): Promise<void> {
        await this.copy(source, destination)
        await this.delete(source)
    }

    async visibility(key: string): Promise<Visibility> {
        const {GetObjectAclCommand} = this.sdk()
        try {
            const response = await this.getClient().send(new GetObjectAclCommand({Bucket: this.config.bucket, Key: this.key(key)}))
            return response.Grants?.some((grant: {Permission?: string, Grantee?: {URI?: string}}) =>
                grant.Permission === 'READ' && grant.Grantee?.URI?.endsWith('/AllUsers')
            )
                ? 'public'
                : 'private'
        } catch (error) {
            if (this.isMissing(error)) {
                throw new StorageFileNotFound(key)
            }
            throw error
        }
    }

    async setVisibility(key: string, visibility: Visibility): Promise<void> {
        const {PutObjectAclCommand} = this.sdk()
        await this.getClient().send(new PutObjectAclCommand({
            Bucket: this.config.bucket,
            Key: this.key(key),
            ACL: this.acl(visibility),
        }))
    }

    url(key: string): string {
        const encodedKey = this.encodeKey(this.key(key))
        if (this.config.url) {
            return `${this.config.url.replace(/\/$/, '')}/${encodedKey}`
        }
        if (this.config.endpoint) {
            const endpoint = new URL(this.config.endpoint)
            if (this.config.forcePathStyle) {
                return `${endpoint.toString().replace(/\/$/, '')}/${this.config.bucket}/${encodedKey}`
            }
            endpoint.hostname = `${this.config.bucket}.${endpoint.hostname}`
            return `${endpoint.toString().replace(/\/$/, '')}/${encodedKey}`
        }
        return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${encodedKey}`
    }

    async temporaryUrl(key: string, expiresInSeconds: number, options: TemporaryUrlOptions = {}): Promise<string> {
        const {GetObjectCommand} = this.sdk()
        const {getSignedUrl} = require('@aws-sdk/s3-request-presigner') as typeof import('@aws-sdk/s3-request-presigner')
        return getSignedUrl(this.getClient() as never, new GetObjectCommand({
            Bucket: this.config.bucket,
            Key: this.key(key),
            ResponseContentType: options.responseContentType,
            ResponseContentDisposition: options.responseContentDisposition,
        }), {expiresIn: expiresInSeconds})
    }

    private async getObject(key: string): Promise<any> {
        const {GetObjectCommand} = this.sdk()
        try {
            return await this.getClient().send(new GetObjectCommand({Bucket: this.config.bucket, Key: this.key(key)}))
        } catch (error) {
            if (this.isMissing(error)) {
                throw new StorageFileNotFound(key)
            }
            throw error
        }
    }

    private async deleteBatch(keys: string[], DeleteObjectsCommand: ReturnType<S3Driver['sdk']>['DeleteObjectsCommand']): Promise<void> {
        await this.getClient().send(new DeleteObjectsCommand({
            Bucket: this.config.bucket,
            Delete: {Objects: keys.map(Key => ({Key})), Quiet: true},
        }))
    }

    private getClient(): S3ClientLike {
        if (!this.client) {
            const {S3Client} = this.sdk()
            const clientConfig = {
                region: this.config.region,
                endpoint: this.config.endpoint,
                forcePathStyle: this.config.forcePathStyle,
                credentials: this.config.credentials,
            }
            this.client = new S3Client(clientConfig)
        }
        return this.client
    }

    private sdk(): typeof import('@aws-sdk/client-s3') {
        return require('@aws-sdk/client-s3') as typeof import('@aws-sdk/client-s3')
    }

    private key(key: string): string {
        return this.prefixer.prefix(key)
    }

    private acl(visibility?: Visibility): 'private' | 'public-read' | undefined {
        return visibility ? visibility === 'public' ? 'public-read' : 'private' : undefined
    }

    private encodeKey(key: string): string {
        return key.split('/').map(encodeURIComponent).join('/')
    }

    private isMissing(error: unknown): boolean {
        const value = error as {name?: string, $metadata?: {httpStatusCode?: number}}
        return value?.name === 'NoSuchKey' || value?.name === 'NotFound' || value?.$metadata?.httpStatusCode === 404
    }
}
