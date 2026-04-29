const listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    const allListings = await listing.find({})
    res.render("listings/index", { allListings });
}

module.exports.renderNewForm = (req, res) => {
    console.log(req.user);

    res.render("listings/new.ejs")
}

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const singleListing = await listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner");

    if (!singleListing) {
        req.flash("error", "Listing You requested does not exists!!");
        return res.redirect("/listings");
    }

    const validReviews = singleListing.reviews.filter((review) => review);
    if (validReviews.length !== singleListing.reviews.length) {
        singleListing.reviews = validReviews.map((review) => review._id);
        await singleListing.save();
        await singleListing.populate("reviews");
    }

    // Backfill geometry for older listings that were created before map coordinates were stored.
    if (!singleListing.geometry || !Array.isArray(singleListing.geometry.coordinates) || singleListing.geometry.coordinates.length !== 2) {
        const geocodeQuery = `${singleListing.location}, ${singleListing.country}`;
        const response = await geocodingClient
            .forwardGeocode({
                query: geocodeQuery,
                limit: 1,
            })
            .send();

        if (response.body.features.length) {
            singleListing.geometry = response.body.features[0].geometry;
            await singleListing.save();
        }
    }

    console.log(singleListing);
    res.render("listings/show", { listing: singleListing });
}

module.exports.createListing = async (req, res, next) => {
        const geocodeQuery = `${req.body.listing.location}, ${req.body.listing.country}`;
        const response = await geocodingClient
                .forwardGeocode({
                        query: geocodeQuery,
                        limit: 1,
                })
                .send();

    const newListing = new listing(req.body.listing);
    newListing.owner = req.user._id;
    if (req.file) {
        newListing.image = { url: req.file.path, filename: req.file.filename };
    }
    if (response.body.features.length) {
        newListing.geometry = response.body.features[0].geometry;
    }
    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash("success", "New Listing Created");
    res.redirect("/listings");
}

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const singleListing = await listing.findById(id);
    if (!singleListing) {
        req.flash("error", "Listing You requested does not exists!!");
        return res.redirect("/listings");
    }

    let originalImageUrl = singleListing.image?.url || singleListing.image;
    if (typeof originalImageUrl === "string") {
        originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    }
    res.render("listings/edit.ejs", { listing: singleListing, originalImageUrl});
}

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    const updatedListing = await listing.findById(id);
    if (!updatedListing) {
        req.flash("error", "Listing You requested does not exists!!");
        return res.redirect("/listings");
    }

    Object.assign(updatedListing, req.body.listing);

    const geocodeQuery = `${updatedListing.location}, ${updatedListing.country}`;
    const response = await geocodingClient
        .forwardGeocode({
            query: geocodeQuery,
            limit: 1,
        })
        .send();

    if (response.body.features.length) {
        updatedListing.geometry = response.body.features[0].geometry;
    }

    if (req.file) {
        const imageUrl = req.file.path || req.file.secure_url || req.file.url;
        if (imageUrl) {
            updatedListing.image = {
                url: imageUrl,
                filename: req.file.filename || req.file.public_id || "listing-image",
            };
        }
    }

    await updatedListing.save();
    req.flash("success", "Listing Updated!!");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await listing.findByIdAndDelete(id);
    if (!deletedListing) {
        req.flash("error", "Listing You requested does not exists!!");
        return res.redirect("/listings");
    }
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings")
}