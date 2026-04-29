if(process.env.NODE_ENV  != "production") {
require('dotenv').config();
}

console.log(process.env.SECRET);

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

const listingsRouter= require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");



const dbUrl = process.env.ATLASDB_URL;

if (!dbUrl) {
    throw new Error("ATLASDB_URL is missing in .env");
}

main()
    .then(() => {
        console.log("connected to DB");
        app.listen(8080, () => {
            console.log("server is listening to port 8080");
        });
    })
    .catch((err) => {
        console.log("DB connection failed:", err.message);
        process.exit(1);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
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

app.use((req, res, next) =>{
    res.locals.success =req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser= req.user;
    next();
});

app.use("/listings", listingsRouter)
app.use("/listings/:id/reviews", reviewsRouter);
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
