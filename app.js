if(process.env.NODE_ENV  != "production") {
require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/review.js");
const session= require("express-session");
const flash= require("connect-flash");
const passport= require("passport");
const LocalStrategy= require("passport-local").Strategy;
const User= require("./models/user.js"); 
const Listing = require("./models/listing.js");
const initData = require("./init/data.js");
const { requireDbConnection } = require("./middleware.js");

const listingsRouter= require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");



const dbUrl =
    process.env.ATLASDB_URL ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI;
const PORT = process.env.PORT || 8080;

mongoose.set("bufferCommands", false);

async function ensureListingsData() {
    const existingCount = await Listing.countDocuments({});
    if (existingCount === 0) {
        await Listing.insertMany(initData.data);
        console.log("No listings found. Seeded default listings into database.");
    }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

const sessionOptions = {
    secret: process.env.SECRET || "staynest-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie:{
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    },
};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Browsers request /favicon.ico automatically; return empty success if no icon file exists.
app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
});

app.get("/privacy", (req, res) => {
    res.send("Privacy policy page coming soon.");
});

app.get("/terms", (req, res) => {
    res.send("Terms and conditions page coming soon.");
});

app.get("/", (req, res) => {
    if (mongoose.connection.readyState === 1) {
        return res.redirect("/listings");
    }

    return res.status(200).send("StayNest server is running. Database is reconnecting; retry in a few moments.");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        dbReadyState: mongoose.connection.readyState,
    });
});

app.use((req, res, next) =>{
    res.locals.success =req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser= req.user;
    next();
});

app.listen(PORT, () => {
    console.log(`server is listening to port ${PORT}`);
});

async function connectWithRetry() {
    if (!dbUrl) {
        console.error("DB URL is missing. Set ATLASDB_URL (or MONGO_URL / DATABASE_URL / MONGODB_URI) on Render.");
        return;
    }

    try {
        await mongoose.connect(dbUrl, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log("connected to DB");
        await ensureListingsData();
    } catch (err) {
        console.error("DB connection failed:", err.message);
        console.error("Retrying DB connection in 5 seconds...");
        setTimeout(connectWithRetry, 5000);
    }
}

connectWithRetry();

app.use("/listings", requireDbConnection, listingsRouter)
app.use("/listings/:id/reviews", requireDbConnection, reviewsRouter);
app.use("/", userRouter);

app.use((req, res) => {
    res.status(404).render("listings/error.ejs", {
        err: null,
        statusCode: 404,
        message: "Page Not Found",
    });
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    if (statusCode !== 404) {
        console.log(err);
    }
    res.status(statusCode).render("listings/error.ejs", { err, statusCode, message });
})
