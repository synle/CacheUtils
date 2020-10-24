import redis from 'redis';

let client: redis.RedisClient;

class RedisCacheUtils {
  static async init() {
    return new Promise((resolve) => {
      logger.info('Initialize Redis Cache');

      client = redis.createClient(parseInt(process.env.REDIS_PORT), process.env.REDIS_SERVER, {
        auth_pass: process.env.REDIS_PASSWORD,
        tls: { servername: process.env.REDIS_SERVER },
      });

      client.ping(function () {
        resolve();
      });
    });
  }

  // string single object
  static async set(cacheKey: string, cacheVal: string | number): Promise<void> {
    return new Promise((resolve, reject) => {
      client.set(cacheKey, cacheVal.toString(), function (err) {
        err ? reject(err) : resolve();
      });
    });
  }

  static async get(cacheKey: string): Promise<string> {
    return new Promise((resolve, reject) => {
      client.get(cacheKey, function (err, value) {
        err ? reject(err) : resolve(value);
      });
    });
  }

  // same as above but save things as json
  static async setJson(cacheKey: string, cacheVal: any): Promise<void> {
    return RedisCacheUtils.set(cacheKey, JSON.stringify(cacheVal));
  }

  static async getJson(cacheKey: string): Promise<any> {
    try {
      return JSON.parse(await RedisCacheUtils.get(cacheKey));
    } catch (err) {
      return null;
    }
  }

  // list
  static async pushToList(cacheKey: string, cacheVal: string | number): Promise<void> {
    return new Promise((resolve, reject) => {
      client.rpush(cacheKey, cacheVal.toString(), function (err) {
        err ? reject(err) : resolve();
      });
    });
  }

  static async getList(cacheKey: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      client.lrange(cacheKey, 0, -1, function (err, value) {
        err ? reject(err) : resolve(value);
      });
    });
  }

  // set
  static async pushToSet(cacheKey: string, cacheVal): Promise<void> {
    return new Promise((resolve, reject) => {
      client.sadd(cacheKey, cacheVal.toString(), function (err) {
        err ? reject(err) : resolve();
      });
    });
  }

  static async getSet(cacheKey: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      client.smembers(cacheKey, function (err, value) {
        err ? reject(err) : resolve(value);
      });
    });
  }

  // hash map set
  static async setHash(cacheKey: string, cacheVal: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const inputs = [];
      for (const cachePropName of Object.keys(cacheVal)) {
        inputs.push(cachePropName);
        inputs.push(cacheVal[cachePropName]);
      }

      client.hmset(cacheKey, ...inputs, function (err, d) {
        err ? reject(err) : resolve();
      });
    });
  }

  static async getHash(cacheKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      client.hgetall(cacheKey, function (err, value) {
        err ? reject(err) : resolve(value);
      });
    });
  }
}

// in memory cache
const memoryCache = {};
class InMemoryCacheUtils {
  static async init() {
    logger.info('Initialize In Memory Cache');
  }

  // string single object
  static async set(cacheKey: string, cacheVal: string | number): Promise<void> {
    memoryCache[cacheKey] = cacheVal;
  }

  static async get(cacheKey: string): Promise<string> {
    return <string>memoryCache[cacheKey];
  }

  // same as above but save things as json
  static async setJson(cacheKey: string, cacheVal: any): Promise<void> {
    return InMemoryCacheUtils.set(cacheKey, JSON.stringify(cacheVal));
  }

  static async getJson(cacheKey: string): Promise<any> {
    try {
      return JSON.parse(await InMemoryCacheUtils.get(cacheKey));
    } catch (err) {
      return null;
    }
  }

  // list
  static async pushToList(cacheKey: string, cacheVal: string | number): Promise<void> {
    memoryCache[cacheKey] = [...(memoryCache[cacheKey] || []), cacheVal.toString()];
  }

  static async getList(cacheKey: string): Promise<string[]> {
    return memoryCache[cacheKey] || [];
  }

  // set
  static async pushToSet(cacheKey: string, cacheVal: string | number): Promise<void> {
    memoryCache[cacheKey] = Array.from(
      new Set((await InMemoryCacheUtils.getSet(cacheKey)).concat(cacheVal.toString())),
    );
  }

  static async getSet(cacheKey: string): Promise<string[]> {
    return memoryCache[cacheKey] || [];
  }

  // hash map set
  static async setHash(cacheKey: string, cacheVal: any): Promise<void> {
    memoryCache[cacheKey] = cacheVal;
  }

  static async getHash(cacheKey: string): Promise<any> {
    return memoryCache[cacheKey];
  }
}

export default RedisCacheUtils;
// export default InMemoryCacheUtils;
