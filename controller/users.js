const {v4: uuidv4} = require('uuid')
const User = require("../models/users");
const {setUser} = require('../service/auth')

async function handleUsersSignup(req, res) {
    const { name, email, password } = req.body;

    await User.create({
        name,
        email,
        password,
    });

    return res.redirect("/");
}


async function handleUsersLogin(req, res) {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password});
    if(!user) return res.render("login", {
        error: "Invalid Username or Password",
    });

    const sessionId = uuidv4();
    const token = setUser(user);
    res.cookie("token", token);
    return res.redirect("/");
}

async function handleUsersLogout(req, res) {
    res.clearCookie("token");
    return res.redirect("/login");
}

module.exports = {
    handleUsersSignup,
    handleUsersLogin,
    handleUsersLogout,
};