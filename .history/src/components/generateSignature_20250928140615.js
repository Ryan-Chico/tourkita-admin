const express = require("express");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors()); // Allow all origins (for development)

const CLOUDINARY_CLOUD_NAME = "dupjdmjha";
const CLOUDINARY_API_KEY = "528165198938892";
const CLOUDINARY_API_SECRET = "QMxObsf6TmVjCT6WJHtVRXJwIpo";

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

app.get("/get-signature", (req, res) => {
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


app.listen(5000, () => console.log("Signature server running on port 5000"));
