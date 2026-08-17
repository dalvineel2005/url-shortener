const redis = require("../connect");


// ==========================================
// HELPERS
// ==========================================

function toBoolean(value) {

    return (
        value === true ||
        value === "true" ||
        value === 1 ||
        value === "1"
    );
}


function parseVisitHistory(value) {

    if (!value) {
        return [];
    }


    if (Array.isArray(value)) {
        return value;
    }


    try {

        return JSON.parse(value);

    } catch (error) {

        console.error(
            "Visit history parse error:",
            error
        );

        return [];
    }
}


// ==========================================
// NORMALIZE URL
// ==========================================

function normalizeUrl(url) {

    if (
        !url ||
        !url.shortId
    ) {

        return null;
    }


    // Parse visit history

    url.visitHistory =
        parseVisitHistory(
            url.visitHistory
        );


    // Convert Redis string to boolean

    url.isPasswordProtected =
        toBoolean(
            url.isPasswordProtected
        );


    // Keep empty expiration as null

    if (
        !url.expiresAt ||
        url.expiresAt === ""
    ) {

        url.expiresAt = null;
    }


    return url;
}


// ==========================================
// CREATE URL
// ==========================================

async function createUrl(urlData) {

    const urlRecord = {

        shortId:
            urlData.shortId,

        redirectURL:
            urlData.redirectURL,

        createdBy:
            urlData.createdBy || "",

        visitHistory:
            JSON.stringify(
                urlData.visitHistory || []
            ),

        createdAt:
            urlData.createdAt ||
            Date.now(),

        expiresAt:
            urlData.expiresAt ?? "",

        isPasswordProtected:
            urlData.isPasswordProtected
                ? "true"
                : "false",

        passwordHash:
            urlData.passwordHash || "",

    };


    console.log(
        "Saving URL to Redis:",
        {
            shortId:
                urlRecord.shortId,

            expiresAt:
                urlRecord.expiresAt,

            isPasswordProtected:
                urlRecord.isPasswordProtected,

            hasPasswordHash:
                Boolean(
                    urlRecord.passwordHash
                ),
        }
    );


    // ------------------------------------------
    // Save URL hash
    // ------------------------------------------

    await redis.hset(
        `url:${urlRecord.shortId}`,
        urlRecord
    );


    // ------------------------------------------
    // Add URL to user's list
    // ------------------------------------------

    if (
        urlRecord.createdBy
    ) {

        await redis.lpush(
            `user_urls:${urlRecord.createdBy}`,
            urlRecord.shortId
        );
    }


    // ------------------------------------------
    // Add URL to global list
    // ------------------------------------------

    await redis.lpush(
        "global:urls",
        urlRecord.shortId
    );


    return urlRecord;
}


// ==========================================
// CHECK IF SHORT ID EXISTS
// ==========================================

async function shortIdExists(
    shortId
) {

    if (!shortId) {
        return false;
    }


    const exists =
        await redis.exists(
            `url:${shortId}`
        );


    return Boolean(exists);
}


// ==========================================
// GET URLS BY SHORT IDS
// ==========================================

async function getUrlsByShortIds(
    shortIds
) {

    if (
        !shortIds ||
        shortIds.length === 0
    ) {

        return [];
    }


    const urls = [];


    for (
        const shortId of shortIds
    ) {

        const url =
            await redis.hgetall(
                `url:${shortId}`
            );


        const normalized =
            normalizeUrl(url);


        if (normalized) {

            urls.push(
                normalized
            );
        }
    }


    return urls;
}


// ==========================================
// FIND ALL URLS
// ==========================================

async function findUrls(
    query = {}
) {

    let shortIds = [];


    // ------------------------------------------
    // USER'S URLS
    // ------------------------------------------

    if (
        query.createdBy
    ) {

        shortIds =
            await redis.lrange(
                `user_urls:${query.createdBy}`,
                0,
                -1
            );

    }


    // ------------------------------------------
    // ALL URLS
    // ------------------------------------------

    else {

        shortIds =
            await redis.lrange(
                "global:urls",
                0,
                -1
            );
    }


    return await getUrlsByShortIds(
        shortIds
    );
}


// ==========================================
// FIND ONE URL
// ==========================================

async function findOneUrl(
    query
) {

    if (
        !query ||
        !query.shortId
    ) {

        return null;
    }


    const url =
        await redis.hgetall(
            `url:${query.shortId}`
        );


    if (
        !url ||
        Object.keys(url).length === 0
    ) {

        return null;
    }


    const normalized =
        normalizeUrl(url);


    console.log(
        "URL loaded:",
        {
            shortId:
                normalized.shortId,

            isPasswordProtected:
                normalized.isPasswordProtected,

            expiresAt:
                normalized.expiresAt,

            hasPasswordHash:
                Boolean(
                    normalized.passwordHash
                ),
        }
    );


    return normalized;
}


// ==========================================
// ADD CLICK
// ==========================================

async function addClick(
    shortId,
    clickData
) {

    if (!shortId) {
        return null;
    }


    const url =
        await findOneUrl({
            shortId
        });


    if (!url) {

        return null;
    }


    // Add click

    url.visitHistory.push(
        clickData
    );


    // Save updated history

    await redis.hset(
        `url:${shortId}`,
        {
            visitHistory:
                JSON.stringify(
                    url.visitHistory
                ),
        }
    );


    return url;
}


// ==========================================
// FIND ONE AND UPDATE
// ==========================================
//
// Kept for compatibility with older code.
// New analytics code should use addClick().
// ==========================================

async function findOneAndUpdateUrl(
    query,
    update
) {

    if (
        !query ||
        !query.shortId
    ) {

        return null;
    }


    if (
        !update ||
        !update.$push ||
        !update.$push.visitHistory
    ) {

        return null;
    }


    return await addClick(
        query.shortId,
        update.$push.visitHistory
    );
}


// ==========================================
// EXPORT
// ==========================================

const URL = {

    create:
        createUrl,

    exists:
        shortIdExists,

    find:
        findUrls,

    findOne:
        findOneUrl,

    addClick:
        addClick,

    findOneAndUpdate:
        findOneAndUpdateUrl,

};


module.exports = URL;