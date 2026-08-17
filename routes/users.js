const express = require("express");

const {
    handleUsersSignup,
    handleUsersLogin,
    handleUsersLogout,
} = require("../controller/users");

const {
    authRateLimiter,
    signupRateLimiter,
} = require("../middlewares/rateLimiter");


const router =
    express.Router();


// ==========================================
// SIGNUP
// ==========================================

router.post(
    "/",
    signupRateLimiter,
    handleUsersSignup
);


// ==========================================
// LOGIN
// ==========================================

router.post(
    "/login",
    authRateLimiter,
    handleUsersLogin
);


// ==========================================
// LOGOUT
// ==========================================

router.get(
    "/logout",
    handleUsersLogout
);


module.exports = router;