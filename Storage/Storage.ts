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

    async read(file: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            fileSystem.readFile(file, (error, data) => {
                if (error) {
                    return reject(error)
                }
                resolve(data)
            })
        })
    }

    exists(file: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            fileSystem.access(file, error => {
                if (error) {
                    return resolve(false)
                }
                resolve(true)
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
        return new Promise(async (resolve, reject) => {
            if (file.content) {
                fileSystem.writeFile(newPath, file.content, error => {
                    if (error) {
                        return reject(error)
                    }
                    resolve(file)
                })
            } else {
                if (file.saved) {
                    fileSystem.createReadStream(file.path)
                        .pipe(fileSystem.createWriteStream(newPath))
                        .on('finish', () => {
                            resolve(file)
                        })
                } else {
                    reject(new Error('Could not save file'))
                }
            }
        })
    }

    async makeDirectory(directory: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fileSystem.mkdir(directory, {recursive: true}, error => {
                if (error) {
                    return reject(error)
                }
                resolve()
            })
        })
    }

    async delete(filePath: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (!await this.exists(filePath)) {
                resolve()
            }
            fileSystem.unlink(filePath, error => {
                if (error) {
                    return reject(error)
                }
                resolve()
            })
        })
    }

    private generateFileName() {
        const stringDomain = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
        return String.random(13, stringDomain) + '-' + new Date().getTime().toString()
    }
}
