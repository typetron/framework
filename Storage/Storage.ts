import * as fileSystem from 'fs'
import { File } from './File'
import * as path from 'path'

export class Storage {
    files(directory: string, recursively = false): File[] {
        return fileSystem
            .readdirSync(directory)
            .reduce((files, name) => {
                const filePath = directory + '/' + name
                const stats = fileSystem.statSync(filePath)
                if (stats.isFile()) {
                    const file = new File(name)
                    file.directory = directory
                    files.push(file)
                }

                if (recursively && stats.isDirectory()) {
                    files = files.concat(this.files(filePath))
                }
                return files
            }, [] as File[])
    }

    async read(filePath: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            fileSystem.readFile(filePath, (error, data) => {
                error ? reject(error) : resolve(data)
            })
        })
    }

    exists(filePath: string): Promise<boolean> {
        return new Promise((resolve) => {
            fileSystem.access(filePath, error => {
                error ? resolve(false) : resolve(true)
            })
        })
    }

    async save(file: File, directory: string = '', name?: string | number): Promise<File> {
        const newPath = path.join(directory, file.name)
        if (!file.name) {
            file.name = String(name || this.generateFileName() + '.' + file.extension)
        }
        if (directory && !await this.exists(directory)) {
            await this.makeDirectory(directory)
        }
        return new Promise(async (resolve) => {
            fileSystem.createReadStream(file.path)
                .pipe(fileSystem.createWriteStream(newPath))
                .on('finish', () => {
                    resolve(file)
                })
        })
    }

    async put(filePath: string, content: string): Promise<File> {
        const file = new File(path.basename(filePath))
        file.directory = path.dirname(filePath).split(path.sep).pop()

        if (file.directory && !await this.exists(file.directory)) {
            await this.makeDirectory(file.directory)
        }

        return new Promise(async (resolve, reject) => {
            fileSystem.writeFile(filePath, content, error => {
                error ? reject(error) : resolve(file)
            })
        })
    }

    async makeDirectory(directory: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fileSystem.mkdir(directory, {recursive: true}, error => {
                error ? reject(error) : resolve()
            })
        })
    }

    async delete(filePath: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!await this.exists(filePath)) {
                resolve()
            }
            fileSystem.unlink(filePath, error => {
                error ? reject(error) : resolve()
            })
        })
    }

    private generateFileName(): string {
        const stringDomain = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
        return String.random(13, stringDomain) + '-' + new Date().getTime().toString()
    }
}
