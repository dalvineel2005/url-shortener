require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");


// ==========================================
// AUTH MIDDLEWARE
// ==========================================

const {
    checkForAuthentication,
    restrictTo,
} = require("./middlewares/auth");


// ==========================================
// URL MODEL
// ==========================================

const URL =
    require("./models/url");


// ==========================================
// ROUTES
// ==========================================

const urlRoute =
    require("./routes/url");

const staticRoute =
    require("./routes/staticRouter");

const userRoute =
    require("./routes/users");


// ==========================================
// URL CONTROLLERS
// ==========================================

const {
    handlePasswordPage,
    handleVerifyLinkPassword,
} =
    require("./controller/url");


// ==========================================
// ANALYTICS
// ==========================================

const {
    getClickData,
} =
    require("./services/analytics");


// ==========================================
// APP
// ==========================================

const app =
    express();


const PORT =
    process.env.PORT || 8001;


// ==========================================
// VIEW ENGINE
// ==========================================

app.set(
    "view engine",
    "ejs"
);

app.set(
    "views",
    path.join(
        __dirname,
        "views"
    )
);


// ==========================================
// SECURITY
// ==========================================

app.use(
    helmet()
);


// ==========================================
// BODY PARSING
// ==========================================

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true,
    })
);


// ==========================================
// COOKIES
// ==========================================

app.use(
    cookieParser()
);


// ==========================================
// AUTHENTICATION
// ==========================================

app.use(
    checkForAuthentication
);


// ==========================================
// PUBLIC SHORT URL
// ==========================================

app.get(
    "/url/:shortId",
    async (req, res) => {

        try {

            const {
                shortId,
            } = req.params;


            console.log(
                "Short URL requested:",
                shortId
            );


            // ----------------------------------
            // FIND URL
            // ----------------------------------

            const entry =
                await URL.findOne({
                    shortId,
                });


            if (!entry) {

                return res.status(404).send(
                    "Short URL not found"
                );
            }


            // ----------------------------------
            // EXPIRATION
            // ----------------------------------

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


            // ----------------------------------
            // PASSWORD
            // ----------------------------------

            if (
                entry.isPasswordProtected === true
            ) {

                return handlePasswordPage(
                    req,
                    res
                );
            }


            // ----------------------------------
            // ANALYTICS
            // ----------------------------------

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


            // ----------------------------------
            // REDIRECT
            // ----------------------------------

            return res.redirect(
                updatedEntry.redirectURL
            );

        }

        catch (error) {

            console.error(
                "Redirect Error:",
                error
            );


            return res.status(500).send(
                "Something went wrong while processing this link"
            );
        }
    }
);


// ==========================================
// PASSWORD VERIFICATION
// ==========================================

app.post(
    "/url/:shortId/verify-password",
    handleVerifyLinkPassword
);


// ==========================================
// PROTECTED URL MANAGEMENT
// ==========================================

app.use(
    "/url",
    restrictTo(["NORMAL"]),
    urlRoute
);


// ==========================================
// USER ROUTES
// ==========================================

app.use(
    "/user",
    userRoute
);


// ==========================================
// WEBSITE ROUTES
// ==========================================

app.use(
    "/",
    staticRoute
);


// ==========================================
// 404
// ==========================================

app.use(
    (req, res) => {

        return res.status(404).send(
            "Page not found"
        );
    }
);


// ==========================================
// GLOBAL ERROR
// ==========================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Unhandled Error:",
            err
        );


        if (res.headersSent) {
            return next(err);
        }


        return res.status(500).send(
            "Internal server error"
        );
    }
);


// ==========================================
// START SERVER
// ==========================================

if (
    process.env.NODE_ENV !==
    "production"
) {

    app.listen(
        PORT,
        () => {

            console.log(
                `Server Started at PORT:${PORT}`
            );
        }
    );
}


module.exports = app;