const express = require("express");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors()); // allow requests from React dev server

// ---------- HARDCODED CLOUDINARY CONFIG ----------
const CLOUDINARY_CLOUD_NAME = "dupjdmjha";
const CLOUDINARY_API_KEY = "528165198938892";
const CLOUDINARY_API_SECRET = "QMxObsf6TmVjCT6WJHtVRXJwIpo";
// ---------------------------------------------------
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

// Endpoint to generate signed upload parameters
app.get("/signature", (req, res) => {
    try {
        const timestamp = Math.round(Date.now() / 1000);
        const paramsToSign = { folder: "ar_assets", timestamp };
        const signature = cloudinary.utils.api_sign_request(paramsToSign, CLOUDINARY_API_SECRET);

        res.json({
            apiKey: CLOUDINARY_API_KEY,
            timestamp,
            signature,
            cloudName: CLOUDINARY_CLOUD_NAME,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate signature" });
    }
});

// Optional root route
app.get("/", (req, res) => {
    res.send("Cloudinary signature server is running. Use /signature.");
});

app.listen(5000, () => console.log("Signature server running on port 5000"));
