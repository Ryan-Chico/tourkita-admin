const cloudinary = require("cloudinary").v2;

// ---------- HARDCODED CLOUDINARY CONFIG ----------
const CLOUDINARY_CLOUD_NAME = "dupjdmjha";
const CLOUDINARY_API_KEY = "YOUR_API_KEY";
const CLOUDINARY_API_SECRET = "YOUR_API_SECRET";
// ---------------------------------------------------

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

// Generate signature for testing
const generateSignature = () => {
    // timestamp for signature
    const timestamp = Math.round(new Date().getTime() / 1000);

    // parameters to sign
    const paramsToSign = { timestamp };

    // generate signature
    const signature = cloudinary.utils.api_sign_request(paramsToSign, CLOUDINARY_API_SECRET);

    console.log("--------- Cloudinary Hardcoded Upload Info ---------");
    console.log("API Key:", CLOUDINARY_API_KEY);
    console.log("Timestamp:", timestamp);
    console.log("Signature:", signature);
    console.log("Cloud Name:", CLOUDINARY_CLOUD_NAME);
    console.log("----------------------------------------------------");
};

generateSignature();
