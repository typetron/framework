# Storage

- [Introduction](#introduction)
- [Configuring Disks](#configuring-disks)
- [Using Disks](#using-disks)
- [Writing and Reading](#writing-and-reading)
- [Listing Files](#listing-files)
- [Uploads and Metadata](#uploads-and-metadata)
- [URLs and Visibility](#urls-and-visibility)
- [Scoped and Read-Only Disks](#scoped-and-read-only-disks)
- [Testing](#testing)
- [Custom Drivers](#custom-drivers)
- [Framework Filesystem](#framework-filesystem)
- [Image Data](#image-data)

## Introduction

Storage provides one asynchronous API for local files, AWS S3, and S3-compatible object stores. Applications work with logical keys relative
to a configured disk rather than operating-system paths. `Storage` resolves named disks lazily and forwards methods to the default disk.

Each disk wraps a `StorageDriver`. Drivers translate portable operations to a backend while `StorageDisk` supplies shared conveniences such
as uploads, JSON decoding, URL generation, and testing assertions.

## Configuring Disks

```ts
import { StorageConfig } from '@Typetron/Framework'

export default new StorageConfig({
    default: 'local',
    disks: {
        local: {
            driver: 'local',
            root: 'storage/app',
            url: '/storage',
        },
        s3: {
            driver: 's3',
            bucket: process.env.AWS_BUCKET!,
            region: process.env.AWS_REGION!,
        },
        objects: {
            driver: 's3',
            bucket: process.env.OBJECT_BUCKET!,
            region: process.env.OBJECT_REGION!,
            endpoint: process.env.OBJECT_ENDPOINT,
            forcePathStyle: true,
            credentials: {
                accessKeyId: process.env.OBJECT_ACCESS_KEY!,
                secretAccessKey: process.env.OBJECT_SECRET_KEY!,
            },
        },
    },
})
```

AWS disks use the SDK's default credential chain when `credentials` is omitted. The S3 driver is loaded only when an S3 disk is resolved;
applications using it must install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.

## Using Disks

Register `StorageProvider`, then inject or resolve `Storage`. Methods on `Storage` target the default disk; `disk` selects another
configured
disk. `build` creates an uncached on-demand disk.

```ts
await storage.put('users/1.txt', 'John')
await storage.disk('s3').put('backups/data.json', '{}')

const temporary = storage.build({driver: 'local', root: '/tmp/exports'})
```

Named disks are constructed once and cached. Use `forget(name)` to discard a cached disk so its next lookup rebuilds it.

## Writing and Reading

`put` accepts a string, `Buffer`, or Node `Readable` and returns a lightweight `File`. `read` returns a `Buffer`; use `readStream` for large
objects and `json` for JSON content.

```ts
const file = await storage.put('users/1.json', JSON.stringify({name: 'John'}), {
    mimeType: 'application/json',
    visibility: 'private',
})

const user = await storage.json<{name: string}>(file.key)
const stream = await storage.readStream(file.key)
```

Use `copy` and `move` within one disk. Moving copies first and deletes the source only after a successful copy. Cross-disk copies are not
implicit; stream the source into the destination when that behavior is required.

## Listing Files

`list` is an `AsyncIterable`, so paginated object-store listings do not have to be retained in memory. `files` collects file entries into
`File` instances.

```ts
for await (const entry of storage.list('users', {recursive: true})) {
    console.log(entry.type, entry.key)
}

const files = await storage.files('users', {recursive: true})
```

Directories are logical prefixes. Writing `users/1/avatar.jpg` creates required local directories, while S3 stores only the object key.
`deleteDirectory('users/1')` removes that non-empty prefix recursively; an empty prefix is rejected.

## Uploads and Metadata

HTTP multipart parsing produces `UploadedFile` instances backed by temporary local files. `putFile` streams the upload to its destination.

```ts
const avatar = request.files.avatar as UploadedFile
await storage.disk('s3').putFile(`avatars/${user.id}.jpg`, avatar)
```

Use `stat` for size, last modification, MIME type, ETag, and backend metadata. A `File` may contain metadata already returned by a listing
or
write, but Storage does not issue an extra metadata request merely to fill every optional field.

## URLs and Visibility

`url` returns a public URL when the disk supports or configures one. `temporaryUrl` creates an expiring S3 URL. Unsupported operations throw
`UnsupportedStorageOperation`.

```ts
const publicUrl = storage.disk('s3').url('avatars/1.jpg')
const privateUrl = await storage.disk('s3').temporaryUrl('reports/1.pdf', 300)
await storage.setVisibility('avatars/1.jpg', 'public')
```

Visibility is `public` or `private`. Local disks map it to file permissions; S3 maps it to object ACLs. Bucket policies may still forbid
public ACLs.

## Scoped and Read-Only Disks

Composition drivers wrap any named disk without changing its implementation:

```ts
disks: {
    s3: {
        driver: 's3', bucket
    :
        'app', region
    :
        'eu-central-1'
    }
,
    avatars: {
        driver: 'scoped', disk
    :
        's3', prefix
    :
        'users/avatars'
    }
,
    assets: {
        driver: 'read-only', disk
    :
        's3'
    }
,
}
```

A scoped disk exposes only keys below its prefix. Mutating a read-only disk throws `ReadOnlyStorage`.

## Testing

`fake` replaces a named disk with an isolated in-memory driver:

```ts
const avatars = storage.fake('avatars')
await service.uploadAvatar(upload)
await avatars.assertExists('users/1.jpg')
await avatars.assertCount('users', 1, true)
```

## Custom Drivers

Register a driver factory with `extend`. The factory receives its disk configuration, name, and Storage manager and returns a
`StorageDriver`. Drivers implement backend translation only; shared application conveniences belong on `StorageDisk`.

## Framework Filesystem

`Filesystem` is a separate local operating-system service used by Typetron to load configuration, controllers, entities, migrations,
seeders, static assets, and file cache data. It is available before `StorageConfig` is loaded, accepts real host paths, and keeps these
framework paths independent of the application's default object-storage disk.

`Filesystem` is framework-internal and is not the local-disk API intended for applications. Application code should use `Storage` or a
named disk such as `storage.disk('local')`. Its synchronous `files` method exists only because framework modules are currently discovered
synchronously during bootstrap; configured storage listings remain asynchronous and backend-neutral.

## Image Data

The `fromBase64` helper decodes an image data URL:

```ts
import { fromBase64 } from '@Typetron/Storage'

const image = fromBase64('data:image/png;base64,iVBORw0KGgo=')

await storage.put(`storage/avatar.${image.extension}`, image.content)
```

Invalid image data throws `InvalidImage` with the message `The image has an invalid data format`.
