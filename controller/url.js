const shortid = require("shortid");
const URL = require("../models/url");

async function handleGenerateNewShortURL(req, res) {
    let { url } = req.body;

    if (!url) {
        return res.status(400).send("URL is required");
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
    }

    const shortId = shortid();

    await URL.create({
        shortId,
        redirectURL: url,
        visitHistory: [],
        createdBy: req.user._id,
    });

    const allUrls = await URL.find({ createdBy: req.user._id });

    return res.render("home", {
        id: shortId,
        urls: allUrls,
    });
}
async function handleGetAnalytics(req, res) {
    const shortId = req.params.shortId;

    const result = await URL.findOne({ shortId });

    return res.json({
        totalClicks: result.visitHistory.length,
        analytics: result.visitHistory,
    });
}

module.exports = {
    handleGenerateNewShortURL,
    handleGetAnalytics,
};