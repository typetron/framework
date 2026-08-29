# Storage

- [Introduction](#introduction)
- [Writing and Reading Files](#writing-and-reading-files)
- [Working With File Objects](#working-with-file-objects)
- [Listing Files](#listing-files)
- [Directories and Deletion](#directories-and-deletion)
- [Image Data](#image-data)

## Introduction

The Storage module provides a small filesystem abstraction used by uploads, migrations, cache files, and static assets. Its asynchronous
methods operate on paths while `File` carries a file's name and directory.

## Writing and Reading Files

Use `put` to write content and receive a `File` describing the result:

```ts
import { Storage } from '@Typetron/Storage'

const storage = new Storage()
const file = await storage.put('storage/users/1.txt', 'John')
const content = await storage.read(file.path)

console.log(content.toString())
```

Missing parent directories are created automatically. `read` resolves to a `Buffer`.

## Working With File Objects

A `File` derives its `path` and `extension` from its name and directory:

```ts
import { File } from '@Typetron/Storage'

const upload = new File('avatar.png', '/tmp/uploads')

console.log(upload.path)
console.log(upload.extension)
```

Use `save(file, directory)` to copy an existing file into another directory. The destination directory is created when needed.

## Listing Files

`files(directory)` returns immediate files as `File` instances. Pass `true` as the second argument to include nested directories:

```ts
const migrations = storage
    .files('Database/migrations', true)
    .where('extension', 'ts')
```

File listing is synchronous internally even though most other storage operations are asynchronous.

## Directories and Deletion

Use `exists`, `makeDirectory`, and `deleteDirectory` for directories. Use `delete` only for file paths:

```ts
if (await storage.exists(file.path)) {
    await storage.delete(file.path)
}
```

Deleting a missing file has no effect. Passing a directory to `delete` throws an error; use `deleteDirectory` for recursive directory
removal.

## Image Data

The `fromBase64` helper decodes an image data URL:

```ts
import { fromBase64 } from '@Typetron/Storage'

const image = fromBase64('data:image/png;base64,iVBORw0KGgo=')

await storage.put(`storage/avatar.${image.extension}`, image.content)
```

Invalid image data throws `InvalidImage` with the message `The image has an invalid data format`.
