const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");

const cloudName = process.env.CLOUD_NAME;
const cloudApiKey = process.env.CLOUD_API_KEY;
const cloudApiSecret = process.env.CLOUD_API_SECRET;

if (!cloudName || !cloudApiKey || !cloudApiSecret) {
    throw new Error("Missing Cloudinary credentials. Set CLOUD_NAME, CLOUD_API_KEY, and CLOUD_API_SECRET in .env.");
}

if (cloudApiKey.includes("CLOUDINARY_URL=") || cloudApiKey.includes("<your_api_key>")) {
    throw new Error("Invalid CLOUD_API_KEY in .env. Use only the raw API key value, not the full CLOUDINARY_URL string or placeholder text.");
}

cloudinary.v2.config({
    cloud_name: cloudName,
    api_key: cloudApiKey,
    api_secret: cloudApiSecret,
});

const storage = cloudinaryStorage({
    cloudinary,
    params: {
        folder: "StayNest_DEV",
        allowed_formats: ["png", "jpg", "jpeg", "webp","avif"],
    },
});

module.exports = {
    cloudinary,
    storage,
};