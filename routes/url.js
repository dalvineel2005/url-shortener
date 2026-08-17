const express = require("express");

const {
    handleGenerateNewShortURL,
    handleGetAnalytics,
    handleQRCode,
} = require("../controller/url");


const router = express.Router();


// ==========================================
// CREATE SHORT URL
// ==========================================

router.post(
    "/",
    handleGenerateNewShortURL
);


// ==========================================
// ANALYTICS
// ==========================================

router.get(
    "/analytics/:shortId",
    handleGetAnalytics
);


// ==========================================
// QR CODE
// ==========================================

router.get(
    "/qr/:shortId",
    handleQRCode
);


module.exports = router;