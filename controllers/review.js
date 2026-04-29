const Review = require("../models/review.js");
const listing = require("../models/listing.js");
const mongoose = require("mongoose");

module.exports.createReview = async (req, res) => {
    let foundListing = await listing.findById(req.params.id);
    if (!foundListing) {
        throw new ExpressError(404, "Listing not found");
    }

    let { review } = req.body;
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    console.log(newReview);
    foundListing.reviews.push(newReview);

    await newReview.save();
    await foundListing.save();
     req.flash("success", "New Review Created");

    console.log("new review saved");
    res.redirect(`/listings/${foundListing._id}`);
}

module.exports.destroyReview = async (req, res) => {
    let { id, reviewID } = req.params;
    await listing.findByIdAndUpdate(id, { $pull: { reviews: reviewID } });
    await Review.findByIdAndDelete(reviewID);

     req.flash("success", "Review Deleted");

    res.redirect(`/listings/${id}`);
};