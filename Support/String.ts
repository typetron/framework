export {};
declare global {
    interface StringConstructor {
        random(length?: number, stringDomain?: string): string;
    }

    interface String {
        capitalize(): this;

        limit(length: number, end?: string): this;
    }
}

const string = '!"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~';
String.random = function (length = Math.randomInt(1, 15), stringDomain = string) {
    const characters = stringDomain.split('');
    let word = '';
    for (let i = 0; i < length; i++) {
        word += characters.random();
    }
    return word;
};

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.limit = function (limit, end = '...') {
    if (limit < this.length) {
        return this.substring(0, limit - end.length) + end;
    }
    return this;
};
