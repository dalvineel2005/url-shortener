const crypto = require("crypto");
const UAParser = require("ua-parser-js");


// ==========================================
// GET CLIENT IP
// ==========================================

function getClientIp(req) {

    const forwardedFor =
        req.headers["x-forwarded-for"];

    if (forwardedFor) {

        return forwardedFor
            .split(",")[0]
            .trim();
    }

    return (
        req.socket?.remoteAddress ||
        "unknown"
    );
}


// ==========================================
// CREATE ANONYMOUS VISITOR ID
// ==========================================

function createVisitorId(req) {

    const ip =
        getClientIp(req);

    const userAgent =
        req.headers["user-agent"] ||
        "unknown";


    return crypto
        .createHash("sha256")
        .update(`${ip}|${userAgent}`)
        .digest("hex");
}


// ==========================================
// GET REFERRER
// ==========================================

function getReferrer(req) {

    return (
        req.get("referer") ||
        req.get("referrer") ||
        "Direct"
    );
}


// ==========================================
// GET CLICK INFORMATION
// ==========================================

function getClickData(req) {

    const userAgent =
        req.headers["user-agent"] || "";


    const parser =
        new UAParser(userAgent);


    const deviceInfo =
        parser.getDevice();

    const browserInfo =
        parser.getBrowser();

    const osInfo =
        parser.getOS();


    let device = "Desktop";


    if (deviceInfo.type === "mobile") {

        device = "Mobile";

    } else if (
        deviceInfo.type === "tablet"
    ) {

        device = "Tablet";

    }


    return {

        timestamp:
            Date.now(),

        visitorId:
            createVisitorId(req),

        device,

        browser:
            browserInfo.name ||
            "Unknown",

        os:
            osInfo.name ||
            "Unknown",

        referrer:
            getReferrer(req),

    };
}


// ==========================================
// ANALYTICS SUMMARY
// ==========================================

function summarizeAnalytics(
    analytics = []
) {

    const devices = {};

    const browsers = {};

    const operatingSystems = {};

    const referrers = {};

    const clicksByDate = {};

    const visitors =
        new Set();


    analytics.forEach(
        (click) => {

            // -----------------------------
            // Unique visitor
            // -----------------------------

            if (click.visitorId) {

                visitors.add(
                    click.visitorId
                );
            }


            // -----------------------------
            // Device
            // -----------------------------

            const device =
                click.device ||
                "Unknown";


            devices[device] =
                (devices[device] || 0) + 1;


            // -----------------------------
            // Browser
            // -----------------------------

            const browser =
                click.browser ||
                "Unknown";


            browsers[browser] =
                (browsers[browser] || 0) + 1;


            // -----------------------------
            // Operating System
            // -----------------------------

            const os =
                click.os ||
                "Unknown";


            operatingSystems[os] =
                (operatingSystems[os] || 0) + 1;


            // -----------------------------
            // Referrer
            // -----------------------------

            const referrer =
                click.referrer ||
                "Direct";


            referrers[referrer] =
                (referrers[referrer] || 0) + 1;


            // -----------------------------
            // Clicks by date
            // -----------------------------

            if (click.timestamp) {

                const date =
                    new Date(
                        Number(
                            click.timestamp
                        )
                    )
                        .toISOString()
                        .slice(0, 10);


                clicksByDate[date] =
                    (
                        clicksByDate[date] ||
                        0
                    ) + 1;
            }

        }
    );


    return {

        totalClicks:
            analytics.length,

        uniqueVisitors:
            visitors.size,

        devices,

        browsers,

        operatingSystems,

        referrers,

        clicksByDate,

        analytics,

    };
}


module.exports = {

    createVisitorId,

    getReferrer,

    getClickData,

    summarizeAnalytics,

};