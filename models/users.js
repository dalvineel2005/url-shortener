const redis = require("../connect");

async function createUser(userData) {
    const user = {
        _id: userData.email, // Use email as unique identifier
        name: userData.name,
        email: userData.email,
        role: "NORMAL",
        password: userData.password,
    };
    await redis.hset(`user:${user.email}`, user);
    return user;
}

async function findUserByEmail(email) {
    const user = await redis.hgetall(`user:${email}`);
    if (!user || Object.keys(user).length === 0) return null;
    return user;
}

const User = {
    create: createUser,
    findOne: async (query) => {
        if (query.email) {
            const user = await findUserByEmail(query.email);
            if (user) {
                if (query.password && user.password !== query.password) return null;
                return user;
            }
        }
        return null;
    }
};

module.exports = User;