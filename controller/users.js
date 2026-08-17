const bcrypt = require("bcrypt");
const User = require("../models/users");
const { setUser } = require("../services/auth");

async function handleUsersSignup(req, res) {
    try {
        const { name, email, password } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).render("signup", {
                error: "Name, email and password are required",
            });
        }

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Password validation
        if (password.length < 6) {
            return res.status(400).render("signup", {
                error: "Password must be at least 6 characters long",
            });
        }

        // Check whether user already exists
        const existingUser = await User.findByEmail(normalizedEmail);

        if (existingUser) {
            return res.status(409).render("signup", {
                error: "An account with this email already exists",
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        await User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
        });

        return res.redirect("/login");

    } catch (error) {
        console.error("Signup Error:", error);

        return res.status(500).render("signup", {
            error: "Something went wrong while creating your account",
        });
    }
}


async function handleUsersLogin(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).render("login", {
                error: "Email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Find user
        const user = await User.findByEmail(normalizedEmail);

        if (!user) {
            return res.status(401).render("login", {
                error: "Invalid email or password",
            });
        }

        // Compare password with stored hash
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordCorrect) {
            return res.status(401).render("login", {
                error: "Invalid email or password",
            });
        }

        // Create JWT
        const token = setUser(user);

        // Store JWT in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return res.redirect("/");

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).render("login", {
            error: "Something went wrong while logging in",
        });
    }
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