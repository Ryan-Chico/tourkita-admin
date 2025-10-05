const cloudinary = require("cloudinary").v2;

const CLOUDINARY_CLOUD_NAME = "dupjdmjha";
const CLOUDINARY_API_KEY = "528165198938892";
const CLOUDINARY_API_SECRET = "QMxObsf6TmVjCT6WJHtVRXJwIpo";

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

// Include all parameters you will send in the frontend
const timestamp = Math.round(new Date().getTime() / 1000);
const paramsToSign = {
    folder: "ar_assets",
    timestamp
};

const signature = cloudinary.utils.api_sign_request(paramsToSign, CLOUDINARY_API_SECRET);

console.log("--------- Cloudinary Hardcoded Upload Info ---------");
console.log("API Key:", CLOUDINARY_API_KEY);
console.log("Timestamp:", timestamp);
console.log("Signature:", signature);
console.log("Cloud Name:", CLOUDINARY_CLOUD_NAME);
console.log("----------------------------------------------------");
