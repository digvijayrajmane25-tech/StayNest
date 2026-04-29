const express= require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const Review = require("../models/review.js");
const listing = require("../models/listing.js");
const mongoose = require("mongoose");
const {validateReview, isLoggedIn, isReviewAuthor} = require("../middleware.js");
const reviewController = require("../controllers/review.js");



const validateObjectId = (req, res, next) => {
    let sanitizedId = req.params.id?.trim().replace(/^['"]|['"]$/g, "");

    if (!mongoose.Types.ObjectId.isValid(sanitizedId)) {
        throw new ExpressError(400, "Invalid listing id");
    }

    req.params.id = sanitizedId;
    next();
}

// Post review Route
router.post("/",isLoggedIn, validateObjectId, validateReview, wrapAsync(reviewController.createReview));

// delete review route

router.delete("/:reviewID",isLoggedIn,isReviewAuthor, wrapAsync(reviewController.destroyReview))

module.exports= router;