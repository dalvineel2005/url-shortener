const redis = require("../connect");

async function createUser(userData) {
    const user = {
        _id: userData.email,
        name: userData.name,
        email: userData.email,
        role: "NORMAL",
        passwordHash: userData.passwordHash,
    };

    await redis.hset(`user:${user.email}`, user);

    return user;
}

async function findUserByEmail(email) {
    const user = await redis.hgetall(`user:${email}`);

    if (!user || Object.keys(user).length === 0) {
        return null;
    }

    return user;
}

const User = {
    create: createUser,

    findOne: async (query) => {
        if (!query || !query.email) {
            return null;
        }

        const user = await findUserByEmail(query.email);

        if (!user) {
            return null;
        }

        return user;
    },

    findByEmail: findUserByEmail,
};

module.exports = User;