require('dotenv').config();
const express = require("express");
const path = require('path')
const cookieParser = require("cookie-parser")
const connectToMongoDB = require("./connect");
const {checkForAuthentication, restrictTo} = require('./middlewares/auth')
const URL = require('./models/url');

const urlRoute = require('./routes/url');
const staticRoute = require('./routes/staticRouter');
const userRoute = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 8001;

connectToMongoDB(process.env.MONGODB_URI || "mongodb://localhost:27017/short-url")
.then(() => console.log('Mongodb connected'))

app.set("view engine", "ejs");
app.set("views",path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthentication);

// Public redirection route must come before restricted routes starting with /url
app.get("/url/:shortId", async (req, res) => {
    const { shortId } = req.params;

    console.log("Short ID:", shortId);

    const entry = await URL.findOneAndUpdate(
        { shortId },
        {
            $push: {
                visitHistory: {
                    timestamp: Date.now(),
                },
            },
        },
        { new: true }
    );

    console.log("Entry:", entry);

    if (!entry) {
        return res.status(404).send("Short URL not found");
    }

    console.log("Redirecting to:", entry.redirectURL);

    return res.redirect(entry.redirectURL);
});

app.use("/url", restrictTo(["NORMAL"]), urlRoute);
app.use("/user", userRoute);
app.use("/",staticRoute);

app.get("/test", async (req, res) => {
    const allUrls = await URL.find({});
    return res.render("home", {
        id: null,
        urls: allUrls,
    });
});

app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`))