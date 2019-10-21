export {};
declare global {
    interface Array<T> {
        empty(): boolean;

        random(): T;

        randomIndex(): number;

        pluck<K extends keyof T>(this: T[], key: K): T[K][];

        mapAsync<U>(callback: (value: T, index: number, array: T[]) => U, thisArg?: this): Promise<T>;

        forEachAsync(callback: (value: T, index: number, array: T[]) => void, thisArg?: this): Promise<void>;

        findWhere<K extends keyof T>(this: T[], property: K, value: T[K]): T | undefined;

        first(this: T[], defaultValue?: Object): T;

        remove<T>(this: T[], item: T): boolean;

        where<K extends keyof T>(this: T[], property: K, value: T[K]): T[];

        whereIn<K extends keyof T>(this: T[], property: K, value: T[K][]): T[];

        groupBy<K extends keyof T>(this: T[], key: K): { [key in K]: T[] };
    }
}

Array.prototype.empty = function () {
    return !this.length;
};

Array.prototype.random = function () {
    return this[Math.randomInt(0, this.length - 1)];
};

Array.prototype.randomIndex = function () {
    return Math.randomInt(0, this.length - 1);
};

Array.prototype.findWhere = function (property, value) {
    return this.find(item => item[property] === value);
};

Array.prototype.pluck = function (key) {
    return this.map(item => item[key]);
};

Array.prototype.remove = function (item) {
    const index = this.indexOf(item);
    if (index === -1) {
        return false;
    }
    this.splice(this.indexOf(item), 1);
    return true;
};

Array.prototype.where = function (property, value) {
    return this.filter(item => item[property] === value);
};

Array.prototype.whereIn = function (property, values) {
    return this.filter(item => values.includes(item[property]));
};

Array.prototype.first = function (defaultValue = undefined) {
    return this[0] || defaultValue;
};

Array.prototype.groupBy = function (key) {
    return this.reduce(function (rv, x) {
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
    }, {});
};

Array.prototype.forEachAsync = async function (callback, thisArg) {
    for (let index = 0; index < this.length; index++) {
        await callback.call(thisArg, this[index], index, this);
    }
};

Array.prototype.mapAsync = async function (callback, thisArg) {
    const promises = [];
    for (let index = 0; index < this.length; index++) {
        promises.push(callback.call(thisArg, this[index], index, this));
    }
    return Promise.all(promises);
};
