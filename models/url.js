const redis = require("../connect");

async function createUrl(urlData) {
    await redis.hset(`url:${urlData.shortId}`, {
        shortId: urlData.shortId,
        redirectURL: urlData.redirectURL,
        createdBy: urlData.createdBy || "",
        visitHistory: JSON.stringify([]),
    });

    if (urlData.createdBy) {
        await redis.lpush(`user_urls:${urlData.createdBy}`, urlData.shortId);
    }

    await redis.lpush(`global:urls`, urlData.shortId);

    return urlData;
}

async function getUrlsByShortIds(shortIds) {
    if (!shortIds || shortIds.length === 0) return [];
    
    const urls = [];
    for (const id of shortIds) {
        const url = await redis.hgetall(`url:${id}`);
        if (url && url.shortId) {
            url.visitHistory = typeof url.visitHistory === 'string' ? JSON.parse(url.visitHistory) : (url.visitHistory || []);
            urls.push(url);
        }
    }
    return urls;
}

async function findUrls(query) {
    if (query && query.createdBy) {
        const shortIds = await redis.lrange(`user_urls:${query.createdBy}`, 0, -1);
        return await getUrlsByShortIds(shortIds);
    } else {
        const shortIds = await redis.lrange(`global:urls`, 0, -1);
        return await getUrlsByShortIds(shortIds);
    }
}

async function findOneUrl(query) {
    if (query && query.shortId) {
        const url = await redis.hgetall(`url:${query.shortId}`);
        if (!url || Object.keys(url).length === 0) return null;
        url.visitHistory = typeof url.visitHistory === 'string' ? JSON.parse(url.visitHistory) : (url.visitHistory || []);
        return url;
    }
    return null;
}

async function findOneAndUpdateUrl(query, update, options) {
    if (query && query.shortId && update.$push && update.$push.visitHistory) {
        const url = await findOneUrl({ shortId: query.shortId });
        if (url) {
            url.visitHistory.push(update.$push.visitHistory);
            await redis.hset(`url:${query.shortId}`, {
                visitHistory: JSON.stringify(url.visitHistory)
            });
            return url;
        }
    }
    return null;
}

const URL = {
    create: createUrl,
    find: findUrls,
    findOne: findOneUrl,
    findOneAndUpdate: findOneAndUpdateUrl,
};

module.exports = URL;
