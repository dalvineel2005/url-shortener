const rateLimit = require("express-rate-limit");


// ==========================================
// AUTH RATE LIMITER
// ==========================================

const authRateLimiter = rateLimit({

    windowMs: 15 * 60 * 1000, // 15 minutes

    limit: 10,

    standardHeaders: "draft-8",

    legacyHeaders: false,

    message: {
        error:
            "Too many authentication attempts. Please try again later.",
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

    message: {
        error:
            "Too many signup attempts. Please try again later.",
    },

});


module.exports = {
    authRateLimiter,
    signupRateLimiter,
};