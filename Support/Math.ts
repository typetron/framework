export {}
declare global {
    interface Math {
        randomInt(min?: number, max?: number): number;
    }
}

Math.randomInt = function (min: number = Number.MIN_SAFE_INTEGER, max: number = Number.MAX_SAFE_INTEGER) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}
