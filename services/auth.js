const jwt = require("jsonwebtoken");


// ==========================================
// JWT SECRET
// ==========================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error(
        "JWT_SECRET is missing from environment variables"
    );
}


// ==========================================
// CREATE USER TOKEN
// ==========================================

function setUser(user) {

    return jwt.sign(
        {
            _id: user._id,
            email: user.email,
            role: user.role,
            name: user.name,
        },
        JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
}


// ==========================================
// VERIFY USER TOKEN
// ==========================================

function getUser(token) {

    if (!token) {
        return null;
    }

    try {

        return jwt.verify(
            token,
            JWT_SECRET
        );

    } catch (error) {

        return null;

    }
}


module.exports = {
    setUser,
    getUser,
};