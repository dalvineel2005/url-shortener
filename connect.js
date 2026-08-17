const { Redis } = require("@upstash/redis");

require("dotenv").config();

const redisUrl =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL;

const redisToken =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
    throw new Error(
        "Redis environment variables are missing. Please configure KV_REST_API_URL and KV_REST_API_TOKEN in Vercel."
    );
}

const redis = new Redis({
    url: redisUrl,
    token: redisToken,
});

module.exports = redis;