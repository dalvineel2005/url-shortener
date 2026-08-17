const QRCode = require("qrcode");


// ==========================================
// GENERATE QR CODE
// ==========================================

async function generateQRCode(url) {

    return await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: "M",
    });
}


module.exports = {
    generateQRCode,
};