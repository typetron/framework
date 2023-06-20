import EngineInterface from "../Contracts/EngineInterface";

// const DatabaseCache = use("DatabaseCache");

class DatabaseCache implements EngineInterface {
  private defaultMinutes = 60;

  constructor(app: any) {
    console.log(app);
  }
  public async get(name: string): Promise<any> {
    if (name) {
      // Implement Database get here
      console.log(name);
      const value = "";
      if (value) {
        return JSON.parse(value);
      }
    }
  }

  public async set(
    name: string,
    data: any,
    duration: number = this.defaultMinutes
  ): Promise<any> {
    if (name && data) {
      // Implement Set method
      console.log(name, data, duration);
      //   data = JSON.stringify(data);
      //   if (duration == null) {
      //     return await this._addCache(name, data);
      //   }
      //   return await this._addExpiredCache(name, data, duration);
    }
  }
  public async flush(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async delete(name: string): Promise<any> {
    // Implement Delete function
    console.log(name);

    return true;
  }
}
export default DatabaseCache;
