const rateLimit = require("express-rate-limit");


// ==========================================
// AUTH RATE LIMITER (login)
// Only failed attempts count, and the error is
// shown on the login page instead of raw JSON.
// ==========================================

const authRateLimiter = rateLimit({

    windowMs: 15 * 60 * 1000, // 15 minutes

    limit: 10,

    skipSuccessfulRequests: true,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    handler: (req, res) => {
        return res.status(429).render("login", {
            error: "Too many login attempts. Please try again in 15 minutes.",
        });
    },

});


// ==========================================
// SIGNUP RATE LIMITER
// ==========================================

const signupRateLimiter = rateLimit({

    windowMs: 60 * 60 * 1000, // 1 hour

    limit: 5,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    handler: (req, res) => {
        return res.status(429).render("signup", {
            error: "Too many signup attempts. Please try again later.",
        });
    },

});


module.exports = {
    authRateLimiter,
    signupRateLimiter,
};
