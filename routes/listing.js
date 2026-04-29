const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schema.js");
const listing = require("../models/listing.js");
const mongoose = require("mongoose");
const { isLoggedIn, isOwner, validateListing, validateObjectId } = require("../middleware.js");

const listingController = require("../controllers/listings.js");
const multer  = require('multer')
const {storage} = require("../cloudconfig.js")
const upload = multer({ storage})


router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.createListing)
    );
    


// New Route
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
    .route("/:id")
    .get(validateObjectId, wrapAsync(listingController.showListing))
    .put(
        isLoggedIn,
        isOwner,
        validateObjectId,
        upload.single("listing[image]"),
        validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(isLoggedIn, isOwner, validateObjectId, wrapAsync(listingController.destroyListing))

// Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, validateObjectId, wrapAsync(listingController.renderEditForm));


module.exports = router;