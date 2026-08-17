const bcrypt = require("bcrypt");
const shortid = require("shortid");

const URL = require("../models/url");

const {
    getClickData,
    summarizeAnalytics,
} = require("../services/analytics");


// ==========================================
// CREATE SHORT URL
// ==========================================

async function handleGenerateNewShortURL(req, res) {

    try {

        console.log("========== CREATE URL ==========");
        console.log("Request body:", req.body);


        if (!req.user) {
            return res.redirect("/login");
        }


        let {
            url,
            customAlias,
            expiration,
            customExpiresAt,
            protectWithPassword,
            linkPassword,
        } = req.body;


        // ==========================================
        // URL VALIDATION
        // ==========================================

        if (!url || !url.trim()) {

            return res.status(400).render("home", {
                id: null,
                urls: await URL.find({
                    createdBy: req.user._id,
                }),
                error: "URL is required",
            });
        }


        url = url.trim();


        if (
            !url.startsWith("http://") &&
            !url.startsWith("https://")
        ) {
            url = "https://" + url;
        }


        // ==========================================
        // EXPIRATION
        // ==========================================

        expiration = expiration || "never";

        let expiresAt = "";


        if (expiration === "1h") {

            expiresAt = new Date(
                Date.now() + 60 * 60 * 1000
            ).toISOString();

        }

        else if (expiration === "1d") {

            expiresAt = new Date(
                Date.now() + 24 * 60 * 60 * 1000
            ).toISOString();

        }

        else if (expiration === "7d") {

            expiresAt = new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString();

        }

        else if (expiration === "30d") {

            expiresAt = new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString();

        }

        else if (
            expiration === "custom" &&
            customExpiresAt
        ) {

            const customDate =
                new Date(customExpiresAt);


            if (
                Number.isNaN(
                    customDate.getTime()
                )
            ) {

                return res.status(400).render("home", {
                    id: null,
                    urls: await URL.find({
                        createdBy: req.user._id,
                    }),
                    error: "Invalid expiration date",
                });
            }


            if (
                customDate.getTime() <= Date.now()
            ) {

                return res.status(400).render("home", {
                    id: null,
                    urls: await URL.find({
                        createdBy: req.user._id,
                    }),
                    error: "Expiration must be in the future",
                });
            }


            expiresAt =
                customDate.toISOString();
        }


        // ==========================================
        // PASSWORD PROTECTION
        // ==========================================

        /*
         * IMPORTANT:
         *
         * Browser checkbox may send:
         *
         * "on"
         *
         * OR
         *
         * "true"
         *
         * OR
         *
         * true
         *
         * So we support ALL of them.
         */

        const isPasswordProtected =
            protectWithPassword === "on" ||
            protectWithPassword === "true" ||
            protectWithPassword === true;


        console.log(
            "Password protection:",
            protectWithPassword
        );

        console.log(
            "Password enabled:",
            isPasswordProtected
        );

        console.log(
            "Password received:",
            linkPassword
                ? "YES"
                : "NO"
        );


        let passwordHash = "";


        if (isPasswordProtected) {

    if (
        !linkPassword ||
        !linkPassword.trim()
    ) {

        return res.status(400).render("home", {
            id: null,
            urls: await URL.find({ createdBy: req.user._id }),
            error: "Please enter a password for this link",
            protectWithPassword: true,
        });
    }


    linkPassword = linkPassword.trim();


    if (linkPassword.length < 6) {

        return res.status(400).render("home", {
            id: null,
            urls: await URL.find({ createdBy: req.user._id }),
            error: "Link password must be at least 6 characters",
            protectWithPassword: true,
        });
    }


    passwordHash =
        await bcrypt.hash(
            linkPassword,
            12
        );
}


        console.log(
            "Protected:",
            isPasswordProtected
        );

        console.log(
            "Hash created:",
            passwordHash
                ? "YES"
                : "NO"
        );


        // ==========================================
        // CUSTOM ALIAS
        // ==========================================

        let shortId;


        if (
            customAlias &&
            customAlias.trim()
        ) {

            customAlias =
                customAlias
                    .trim()
                    .toLowerCase();


            if (
                !/^[a-zA-Z0-9_-]{3,30}$/.test(
                    customAlias
                )
            ) {

                const urls =
                    await URL.find({
                        createdBy:
                            req.user._id,
                    });


                return res.status(400).render(
                    "home",
                    {
                        id: null,
                        urls,
                        error:
                            "Invalid custom alias",
                    }
                );
            }


            const reservedAliases = [
                "login",
                "signup",
                "logout",
                "api",
                "user",
                "url",
                "admin",
                "dashboard",
                "analytics",
            ];


            if (
                reservedAliases.includes(
                    customAlias
                )
            ) {

                const urls =
                    await URL.find({
                        createdBy:
                            req.user._id,
                    });


                return res.status(400).render(
                    "home",
                    {
                        id: null,
                        urls,
                        error:
                            "This alias is reserved",
                    }
                );
            }


            if (
                await URL.exists(
                    customAlias
                )
            ) {

                const urls =
                    await URL.find({
                        createdBy:
                            req.user._id,
                    });


                return res.status(409).render(
                    "home",
                    {
                        id: null,
                        urls,
                        error:
                            "This custom alias is already in use",
                    }
                );
            }


            shortId =
                customAlias;

        }

        else {

            shortId =
                shortid();


            while (
                await URL.exists(
                    shortId
                )
            ) {

                shortId =
                    shortid();
            }
        }


        // ==========================================
        // SAVE URL
        // ==========================================

        await URL.create({

            shortId,

            redirectURL:
                url,

            createdBy:
                req.user._id,

            visitHistory:
                [],

            createdAt:
                Date.now(),

            expiresAt,

            isPasswordProtected,

            passwordHash,

        });


        console.log(
            "URL created:",
            shortId
        );


        // ==========================================
        // GET UPDATED URL LIST
        // ==========================================

        const allUrls =
            await URL.find({
                createdBy:
                    req.user._id,
            });


        return res.render(
            "home",
            {

                id:
                    shortId,

                urls:
                    allUrls,

                error:
                    null,

            }
        );


    }

    catch (error) {

        console.error(
            "Create URL Error:",
            error
        );


        return res.status(500).send(
            "Something went wrong while creating the URL"
        );
    }
}


// ==========================================
// PASSWORD PAGE
// ==========================================

async function handlePasswordPage(
    req,
    res
) {

    try {

        const {
            shortId,
        } = req.params;


        const entry =
            await URL.findOne({
                shortId,
            });


        if (!entry) {

            return res.status(404).send(
                "Short URL not found"
            );
        }


        if (
            entry.expiresAt &&
            entry.expiresAt !== ""
        ) {

            const expirationTime =
                new Date(
                    entry.expiresAt
                ).getTime();


            if (
                !Number.isNaN(
                    expirationTime
                ) &&
                Date.now() >=
                expirationTime
            ) {

                return res.status(410).send(
                    "This short link has expired."
                );
            }
        }


        return res.render(
            "password",
            {
                shortId,
                error: null,
            }
        );

    }

    catch (error) {

        console.error(
            "Password Page Error:",
            error
        );


        return res.status(500).send(
            "Unable to open password page"
        );
    }
}


// ==========================================
// VERIFY PASSWORD
// ==========================================

async function handleVerifyLinkPassword(
    req,
    res
) {

    try {

        const {
            shortId,
        } = req.params;


        const {
            password,
        } = req.body;


        console.log(
            "Password verification:",
            shortId
        );


        if (
            !password ||
            !password.trim()
        ) {

            return res.status(400).render(
                "password",
                {
                    shortId,
                    error:
                        "Please enter the password",
                }
            );
        }


        const entry =
            await URL.findOne({
                shortId,
            });


        if (!entry) {

            return res.status(404).send(
                "Short URL not found"
            );
        }


        if (
            !entry.isPasswordProtected
        ) {

            return res.redirect(
                `/url/${shortId}`
            );
        }


        const isValid =
            await bcrypt.compare(
                password,
                entry.passwordHash
            );


        if (!isValid) {

            return res.status(401).render(
                "password",
                {
                    shortId,
                    error:
                        "Incorrect password. Please try again.",
                }
            );
        }


        // ==========================================
        // PASSWORD CORRECT
        // ==========================================

        const clickData =
            getClickData(req);


        const updatedEntry =
            await URL.addClick(
                shortId,
                clickData
            );


        if (!updatedEntry) {

            return res.status(404).send(
                "Short URL not found"
            );
        }


        return res.redirect(
            updatedEntry.redirectURL
        );

    }

    catch (error) {

        console.error(
            "Password Verification Error:",
            error
        );


        return res.status(500).send(
            "Something went wrong while verifying the password"
        );
    }
}


// ==========================================
// ANALYTICS
// ==========================================

async function handleGetAnalytics(
    req,
    res
) {

    try {

        const {
            shortId,
        } = req.params;


        const entry =
            await URL.findOne({
                shortId,
            });


        if (!entry) {

            return res.status(404).send(
                "Short URL not found"
            );
        }


        const analytics =
            summarizeAnalytics(
                entry.visitHistory || []
            );


        return res.render(
            "analytics",
            {

                url:
                    entry,

                analytics,

            }
        );

    }

    catch (error) {

        console.error(
            "Analytics Error:",
            error
        );


        return res.status(500).send(
            "Unable to load analytics"
        );
    }
}


// ==========================================
// QR CODE
// ==========================================

async function handleQRCode(
    req,
    res
) {

    try {

        const {
            shortId,
        } = req.params;


        const entry =
            await URL.findOne({
                shortId,
            });


        if (!entry) {

            return res.status(404).send(
                "Short URL not found"
            );
        }


        const QRCode =
            require("qrcode");


        const fullUrl =
            `${req.protocol}://${req.get("host")}/url/${shortId}`;


        const qrImage =
            await QRCode.toDataURL(
                fullUrl
            );


        return res.render(
            "qr",
            {
                shortId,
                shortUrl: fullUrl,
                qrCode: qrImage,
            }
        );

    }

    catch (error) {

        console.error(
            "QR Code Error:",
            error
        );


        return res.status(500).send(
            "Unable to generate QR code"
        );
    }
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {

    handleGenerateNewShortURL,

    handlePasswordPage,

    handleVerifyLinkPassword,

    handleGetAnalytics,

    handleQRCode,

};