import CacheInterface from "../Contracts/CacheInterface";
import ServiceInterface from "../Contracts/ServiceInterface";
export abstract class Cache implements CacheInterface {
  private cacheService: ServiceInterface;
  constructor(cacheService: ServiceInterface) {
    this.cacheService = cacheService;
  }

  public async get(name: string): Promise<any> {
    if (name) {
      return await this.cacheService.get(name);
    }
    throw new Error("Specify a name");
  }

  public async has(name: string): Promise<Boolean> {
    const value = await this.cacheService.get(name);
    return !!value;
  }

  public async set(name: string, data: any, minutes: number): Promise<any> {
    if (name && data) {
      return await this.cacheService.set(name, data, minutes);
    }
    throw new Error("Specify a name and data to cache");
  }

  public async delete(name: string): Promise<Boolean> {
    if (await this.has(name)) {
      await this.cacheService.delete(name);
      return true;
    }
    return false;
  }

  public async update(
    name: string,
    data: any,
    minutes: number = 0
  ): Promise<any> {
    if (await this.has(name)) {
      await this.delete(name);
      return await this.set(name, data, minutes);
    } else return await this.set(name, data, minutes);
  }

  public async remember(
    name: string,
    minutes: number,
    callback: Function
  ): Promise<any> {
    if (await this.has(name)) {
      return await this.get(name);
    } else {
      const data = await callback();
      await this.set(name, data, minutes);
      return data;
    }
  }

  public async rememberForever(name: string, callback: Function): Promise<any> {
    if (await this.has(name)) {
      return await this.get(name);
    } else {
      const data = await callback();
      await this.cacheService.set(name, data);
      return data;
    }
  }

  public async many(keys: Array<string>): Promise<Record<string, unknown>> {
    let values: any = Promise.all(keys.map((key: string) => this.get(key)));
    let mappedValues: Record<string, unknown> = {};
    for (let index: number = 0; index < keys.length; index++) {
      mappedValues[keys[index]] = values[index];
    }
    return mappedValues;
  }

  public async setMany(
    data: Record<string, unknown>,
    minutes: number = 0
  ): Promise<any> {
    for (let prop in data) {
      await this.set(prop, data[prop], minutes);
    }
    return data;
  }

  public async flush(): Promise<void> {
    return await this.cacheService.flush();
  }

  public async forever(key: string, values: any): Promise<any> {
    if (key && values) {
      return await this.cacheService.set(key, values);
    }
    throw new Error("Specify a name and data to cache");
  }
}

/*

    public function get($key) {}
    public function many(array $keys) {}
    public function put($key, $value, $seconds) {}
    public function putMany(array $values, $seconds) {}
    public function increment($key, $value = 1) {}
    public function decrement($key, $value = 1) {}
    public function forever($key, $value) {}
    public function forget($key) {}
    public function flush() {}
    public function getPrefix() {}

	*/
