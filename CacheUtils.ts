import redis from 'redis';

import { getLogger } from 'src/utils/LoggerUtils';
const logger = getLogger(__filename);

let client: redis.RedisClient;

class RedisCacheUtils {
  static async init() {
    logger.info('Initialize Redis Cache');
    client = await RedisCacheUtils.getClient();
  }

  static async getClient(): Promise<redis.RedisClient> {
    return new Promise((resolve) => {
      const newClient = redis.createClient(parseInt(process.env.REDIS_PORT), process.env.REDIS_SERVER, {
        auth_pass: process.env.REDIS_PASSWORD,
        tls: { servername: process.env.REDIS_SERVER },
      });

      newClient.ping(function () {
        resolve(newClient);
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

  static async isSetValueExisted(cacheKey: string, cacheVal: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      client.sismember(cacheKey, cacheVal, function (err, value) {
        err ? reject(err) : resolve(value >= 1);
      });
    });
  }

  // hash map set
  static async setHash(cacheKey: string, cacheVal: { [key: string]: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      const inputs = [];
      for (const cachePropName of Object.keys(cacheVal)) {
        inputs.push(cachePropName);
        inputs.push(cacheVal[cachePropName]);
      }

      client.hmset(cacheKey, ...inputs, function (err) {
        err ? reject(err) : resolve();
      });
    });
  }

  static async setHashPartial(cacheKey: string, cachePropName: string, cacheVal: number | string): Promise<void> {
    return new Promise((resolve, reject) => {
      client.hmset(cacheKey, cachePropName, cacheVal, function (err) {
        err ? reject(err) : resolve();
      });
    });
  }

  static async delSingleHashProperty(cacheKey: string, cachePropName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      client.hdel(cacheKey, cachePropName, function (err) {
        err ? reject(err) : resolve();
      });
    });
  }

  static async isHashPropertyExisted(cacheKey: string, cachePropName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      client.hexists(cacheKey, cachePropName, function (err, value) {
        err ? reject(err) : resolve(value >= 1);
      });
    });
  }

  static async getHash(cacheKey: string): Promise<{ [key: string]: string }> {
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

  static async isSetValueExisted(cacheKey: string, cacheVal: string): Promise<boolean> {
    return (memoryCache[cacheKey] || []).includes(cacheVal);
  }

  // hash map set
  static async setHash(cacheKey: string, cacheVal: { [key: string]: string }): Promise<void> {
    memoryCache[cacheKey] = cacheVal;
  }

  static async setHashPartial(cacheKey: string, cachePropName: string, cacheVal: number | string): Promise<void> {
    memoryCache[cacheKey] = memoryCache[cacheKey] || {};
    memoryCache[cacheKey][cachePropName] = cacheVal;
  }

  static async delSingleHashProperty(cacheKey: string, cachePropName: string): Promise<void> {
    delete memoryCache[cacheKey][cachePropName];
  }

  static async isHashPropertyExisted(cacheKey: string, cachePropName: string): Promise<boolean> {
    return !!memoryCache[cacheKey][cachePropName];
  }

  static async getHash(cacheKey: string): Promise<{ [key: string]: string }> {
    return memoryCache[cacheKey];
  }
}

export default RedisCacheUtils;
// export default InMemoryCacheUtils;
