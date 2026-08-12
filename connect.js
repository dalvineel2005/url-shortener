const { Redis } = require("@upstash/redis");
require('dotenv').config();

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.warn("WARNING: Redis URL or Token is missing. Please set KV_REST_API_URL or UPSTASH_REDIS_REST_URL in your environment variables.");
}

const redis = new Redis({
  url: redisUrl || "https://dummy-url.upstash.io",
  token: redisToken || "dummy-token",
});

module.exports = redis;