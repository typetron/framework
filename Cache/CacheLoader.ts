import { CacheConfig } from "@Typetron/Framework";
import { Container } from "@Typetron/Container";
import { Cache } from "./Consumers/Cache";
// const DatabaseCacheService = require("../src/Services/DatabaseCacheService");
import { FileCacheService } from "./Services/FileCacheService";
import { Inject } from "@Typetron/Container";
// const RedisCacheService = require("../src/Services/RedisCacheService");
// const MemCacheService = require("../src/Services/MemCacheService");

export class CacheLoader {
  @Inject()
  config: CacheConfig;

  @Inject()
  app: Container;

  public createCache() {
    let cache: any;

    switch (this.config.driver.toLowerCase()) {
      //   case "memcache":
      //     // Load MemCacheService
      //     cache = new Cache(new MemCacheService(this.app));
      //     break;
      //   case "redis":
      //     // Load RedisCacheService
      //     cache = new Cache(new RedisCacheService(this.app));
      //     break;
      //   case "database":
      //     // Load DatabaseCacheService
      //     cache = new Cache(new DatabaseCacheService(this.app));
      //     break;
      case "file":
        // Load FileCacheService
        cache = this.app.get(FileCacheService);
        cache.config = this.config.drivers["file"];
        break;

      default:
        throw new Error("No driver provided");
    }
    return cache;
  }
}
