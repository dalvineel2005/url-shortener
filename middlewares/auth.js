const { getUser } = require("../services/auth");


// ==========================================
// CHECK AUTHENTICATION
// ==========================================

function checkForAuthentication(req, res, next) {

    const token = req.cookies?.token;

    if (!token) {

        req.user = null;

        return next();
    }


    const user = getUser(token);

    if (!user) {

        req.user = null;

        // Remove invalid/expired token
        res.clearCookie("token");

        return next();
    }


    // Attach authenticated user
    // to request

    req.user = user;

    return next();
}



// ==========================================
// RESTRICT BY ROLE
// ==========================================

function restrictTo(allowedRoles = []) {

    return function (req, res, next) {

        // User is not logged in
        if (!req.user) {

            return res.redirect("/login");
        }


        // No roles specified
        if (allowedRoles.length === 0) {

            return next();
        }


        // Check user role
        if (!allowedRoles.includes(req.user.role)) {

            return res.status(403).send(
                "You are not authorized to access this resource"
            );
        }


        return next();
    };
}


module.exports = {
    checkForAuthentication,
    restrictTo,
};