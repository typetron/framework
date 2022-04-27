export {}

type ArrayItemCallback<T, R = T> = (item: T, index: number, array: T[]) => R;

declare global {
    interface Array<T> {
        empty(): boolean;

        random(): T;

        randomIndex(): number;

        pluck<K extends keyof T>(this: T[], property: K): T[K][];

        mapAsync<U>(callback: ArrayItemCallback<T, Promise<U>>, thisArg?: this): Promise<U[]>;

        forEachAsync(callback: ArrayItemCallback<T, void>, thisArg?: this): Promise<void>;

        // tslint:disable-next-line:no-any
        findWhere<K extends keyof T>(this: T[], property: K, value: T[K] | ArrayItemCallback<T, any>): T | undefined;

        first(this: T[], defaultValue?: T): T | undefined;

        last(this: T[], defaultValue?: T): T | undefined;

        remove<T>(this: T[], ...items: T[]): void;

        where<K extends keyof T>(this: T[], property: K, value: T[K]): T[];

        whereIn<K extends keyof T>(this: T[], property: K, value: T[K][]): T[];

        groupBy<K extends keyof T>(this: T[], property: K): Record<K, T[]>;

        sortBy<K extends keyof T>(this: T[], key: K, order?: 'ASC' | 'DESC' | 1 | -1): T[]

        groupBy<U extends string | number | symbol>(this: T[], callback: ArrayItemCallback<T, U>): Record<U, T[]>;

        unique<K extends keyof T>(this: T[], key?: K | ((item: T, index: number) => unknown)): T[];

        sum<T extends number>(this: T[]): number;

        sum<K extends keyof T, U extends number>(key: K | ArrayItemCallback<T, U>): U;

        whenNotEmpty (callback: () => void): this;

        whenEmpty (callback: () => void): this;
    }
}

Array.prototype.empty = function() {
    return !this.length
}

Array.prototype.random = function() {
    return this[Math.randomInt(0, this.length - 1)]
}

Array.prototype.randomIndex = function() {
    return Math.randomInt(0, this.length - 1)
}

// tslint:disable-next-line:no-any
Array.prototype.findWhere = function <T, K extends keyof T>(property: K, value: T[K] | ArrayItemCallback<T, any>) {
    return this.find(item => item[property] === value)
}

Array.prototype.pluck = function <T, K extends keyof T, U>(property: K) {
    return this.map((item: T) => item[property] as unknown as U)
}

Array.prototype.remove = function <T>(...items: T[]) {
    return items.map(item => {
        const index = this.indexOf(item)
        if (index === -1) {
            return
        }
        this.splice(this.indexOf(item), 1)
    })
}

Array.prototype.where = function <T, K extends keyof T>(property: K, value: T[K]) {
    return this.filter(item => item[property] === value)
}

Array.prototype.whereIn = function <T, K extends keyof T>(property: K, values: (T[K])[]) {
    return this.filter(item => values.includes(item[property]))
}

Array.prototype.first = function(defaultValue = undefined) {
    const [first] = this
    return first || defaultValue
}

Array.prototype.last = function(defaultValue = undefined) {
    return this[this.length - 1] || defaultValue
}

Array.prototype.groupBy = function <T, K extends keyof T, U>(property: K | ArrayItemCallback<T, U>) {
    const callback = property instanceof Function ? property : (item: T) => item[property]
    return this.reduce((accumulator, item, index, array) => {
        const key = callback(item, index, array);
        (accumulator[key] = accumulator[key] || []).push(item)
        return accumulator
    }, {})
}

Array.prototype.sortBy = function <T, K extends keyof T>(this: T[], key: K, order?: 'ASC' | 'DESC' | 1 | -1): T[] {
    const o = (order === 'ASC' ? 1 : order === 'DESC' ? -1 : order) || 1
    return this.sort((a, b) => a[key] > b[key] ? 1 * o : b[key] > a[key] ? -1 * o : 0)
}

Array.prototype.forEachAsync = async function <T>(callback: ArrayItemCallback<T, void>, thisArg: T[]) {
    for (let index = 0; index < this.length; index++) {
        await callback.call(thisArg, this[index], index, this)
    }
}

Array.prototype.mapAsync = async function <T, U>(callback: ArrayItemCallback<T, Promise<U>>, thisArg: T[]) {
    const promises = []
    for (let index = 0; index < this.length; index++) {
        promises.push(callback.call(thisArg, this[index], index, this))
    }
    return Promise.all(promises)
}

Array.prototype.unique = function <T, K extends keyof T>(property?: K | ((item: T, index: number) => unknown)): T[] {
    if (!property) {
        return [...new Set(this)] as T[]
    }

    let callback: (item: T, index: number, list: T[]) => unknown
    if (typeof property === 'function') {
        callback = property
    } else {
        callback = (item) => item[property]
    }

    const exists = new Set
    return this.filter((item, index) => {
        let id: unknown
        if (!exists.has(id = callback(item, index, this))) {
            exists.add(id)
            return true
        }
    })
}

Array.prototype.sum = function <T, K extends keyof T, U extends number>(property?: K | ArrayItemCallback<T, U>) {
    const callback = property instanceof Function ? property : (item: T) => property ? item[property] : item
    return this.reduce((accumulator, item, index, array) => {
        return accumulator + callback(item, index, array)
    }, 0)
}

Array.prototype.whenNotEmpty = function(callback) {
    if(!this.empty()) {
        callback()
    }

    return this
}

Array.prototype.whenEmpty = function(callback) {
    if(this.empty()) {
        callback()
    }

    return this
}