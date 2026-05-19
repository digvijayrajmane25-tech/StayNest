const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const mongoose = require("mongoose");

module.exports.isLoggedIn = (req ,res ,next)=>{
    if(!req.isAuthenticated()){
        let loginMessage = "You must be logged in to access this page";
        if (req.method === "GET") {
            req.session.redirectUrl = req.originalUrl;
        } else {
            req.session.redirectUrl = req.get("referer") || "/listings";
            loginMessage = "Please log in first, then retry that action";
        }
        req.flash("error", loginMessage);
        return res.redirect("/login");
    }
    next();
};

module.exports.saveReddirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
        delete req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    if (!listing.owner || !req.user || !listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not the owner of this listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
};


module.exports.validateListing = (req, res, next) => {
    if (!req.body || !req.body.listing) {
        throw new ExpressError(400, "Listing data is required");
    }

    let { error } = listingSchema.validate(req.body.listing);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

module.exports.validateObjectId = (req, res, next) => {
    let sanitizedId = req.params.id?.trim().replace(/^['"]|['"]$/g, "");

    if (!mongoose.Types.ObjectId.isValid(sanitizedId)) {
        throw new ExpressError(400, "Invalid listing id");
    }

    req.params.id = sanitizedId;
    next();
}

module.exports.validateReview = (req, res, next) => {
    if (!req.body || !req.body.review) {
        throw new ExpressError(400, "Review data is required");
    }

    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
}

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewID } = req.params;
    let review = await Review.findById(reviewID);

    if (!review) {
        req.flash("error", "Review not found");
        return res.redirect(`/listings/${id}`);
    }

    if (!review.author || !req.user || !review.author.equals(req.user._id)) {
        req.flash("error", "You are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.requireDbConnection = (req, res, next) => {
    if (mongoose.connection.readyState === 1) {
        return next();
    }

    const message = "Database is temporarily unavailable. Please try again in a moment.";
    req.flash("error", message);
    return res.status(503).render("listings/error.ejs", {
        err: null,
        statusCode: 503,
        message,
    });
};
