import fs from 'node:fs'
import * as fileSystem from 'node:fs/promises'
import path from 'node:path'
import { File } from './File'

/**
 * Typetron's internal access to the host operating-system filesystem.
 *
 * Framework bootstrap uses this service before application storage configuration
 * is available. It accepts real OS paths so Typetron can discover configuration,
 * controllers, entities, migrations, seeders, static assets, and file-cache data.
 * Application code should use `Storage` and its configured disks instead.
 *
 * This is deliberately separate from `LocalDriver`: a local storage disk is
 * constrained to its configured root and works with portable logical keys,
 * while this service works with framework-owned host paths.
 *
 * @internal
 */
export class Filesystem {
    /**
     * Lists files synchronously because framework modules are currently loaded
     * synchronously during bootstrap. Application storage listings are async.
     */
    files(directory: string, recursively = false): File[] {
        return fs.readdirSync(directory).reduce((files, name) => {
            const filePath = path.join(directory, name)
            const stats = fs.statSync(filePath)
            if (stats.isFile()) {
                files.push(new File(filePath))
            }
            if (recursively && stats.isDirectory()) {
                files.push(...this.files(filePath, true))
            }
            return files
        }, [] as File[])
    }

    async read(filePath: string): Promise<Buffer> {
        return fileSystem.readFile(filePath)
    }

    async exists(filePath: string): Promise<boolean> {
        try {
            await fileSystem.access(filePath)
            return true
        } catch {
            return false
        }
    }

    async save(file: File, destination: string, name?: string | number): Promise<File> {
        const stats = await fileSystem.stat(destination).catch(() => undefined)
        const destinationPath = stats?.isDirectory()
            ? path.join(destination, String(name ?? file.name))
            : destination
        await fileSystem.mkdir(path.dirname(destinationPath), {recursive: true})
        await fileSystem.copyFile(file.path, destinationPath)
        return new File(destinationPath)
    }

    async put(filePath: string, content: string | Buffer, options?: Parameters<typeof fileSystem.writeFile>[2]): Promise<File> {
        await fileSystem.mkdir(path.dirname(filePath), {recursive: true})
        await fileSystem.writeFile(filePath, content, options)
        return new File(filePath)
    }

    async makeDirectory(directory: string): Promise<void> {
        await fileSystem.mkdir(directory, {recursive: true})
    }

    async deleteDirectory(directory: string): Promise<void> {
        if (await this.exists(directory)) {
            await fileSystem.rm(directory, {recursive: true})
        }
    }

    async delete(filePath: string): Promise<void> {
        if (!(await this.exists(filePath))) {
            return
        }
        if ((await fileSystem.stat(filePath)).isDirectory()) {
            throw new Error('Can not delete because this path leads to a directory and not a file.')
        }
        await fileSystem.unlink(filePath)
    }
}
