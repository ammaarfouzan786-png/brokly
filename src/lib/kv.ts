import { Redis } from '@upstash/redis';

// Durable key-value + list store. Uses Upstash/Vercel KV when configured
// (works on Vercel serverless where memory doesn't persist), else a
// process-local in-memory fallback so local dev needs zero setup.
//
// Values are stored as explicit JSON strings and parsed on read, in BOTH
// backends, so behaviour is identical everywhere (automaticDeserialization is
// turned off on the Upstash client to avoid its parse ambiguity).

export interface KV {
  get<T>(key: string): Promise<T | null>;
  set(key: string, val: unknown): Promise<void>;
  rpush(key: string, val: unknown): Promise<number>; // returns new length
  llen(key: string): Promise<number>;
  lrange<T>(key: string, start: number, stop: number): Promise<T[]>;
}

function makeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token, automaticDeserialization: false });
}

function redisImpl(redis: Redis): KV {
  return {
    async get<T>(key: string) {
      const s = (await redis.get<string>(key)) as string | null;
      return s == null ? null : (JSON.parse(s) as T);
    },
    async set(key, val) {
      await redis.set(key, JSON.stringify(val));
    },
    async rpush(key, val) {
      return await redis.rpush(key, JSON.stringify(val));
    },
    async llen(key) {
      return await redis.llen(key);
    },
    async lrange<T>(key: string, start: number, stop: number) {
      const arr = (await redis.lrange<string>(key, start, stop)) as string[];
      return (arr || []).map((x) => JSON.parse(x) as T);
    },
  };
}

function memImpl(): KV {
  const g = globalThis as unknown as { __broklyKV?: { kv: Map<string, string>; lists: Map<string, string[]> } };
  const mem = g.__broklyKV ?? (g.__broklyKV = { kv: new Map(), lists: new Map() });
  return {
    async get<T>(key: string) {
      const s = mem.kv.get(key);
      return s == null ? null : (JSON.parse(s) as T);
    },
    async set(key, val) {
      mem.kv.set(key, JSON.stringify(val));
    },
    async rpush(key, val) {
      let arr = mem.lists.get(key);
      if (!arr) {
        arr = [];
        mem.lists.set(key, arr);
      }
      arr.push(JSON.stringify(val));
      return arr.length;
    },
    async llen(key) {
      return mem.lists.get(key)?.length ?? 0;
    },
    async lrange<T>(key: string, start: number, stop: number) {
      const arr = mem.lists.get(key) ?? [];
      const s = start < 0 ? Math.max(arr.length + start, 0) : start;
      const e = stop < 0 ? arr.length + stop : stop;
      return arr.slice(s, e + 1).map((x: string) => JSON.parse(x) as T);
    },
  };
}

const redis = makeRedis();

/** True when a durable backend (Upstash/Vercel KV) is configured. */
export const isDurable = (): boolean => redis !== null;

export const kv: KV = redis ? redisImpl(redis) : memImpl();
