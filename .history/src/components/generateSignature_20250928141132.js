const express = require("express");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());

cloudinary.config({
    cloud_name: "dupjdmjha",
    api_key: "528165198938892",
    api_secret: "QMxObsf6TmVjCT6WJHtVRXJwIpo",
});

app.get("/signature", (req, res) => {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { folder: "ar_assets", timestamp };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, cloudinary.config().api_secret);

    res.json({
        apiKey: cloudinary.config().api_key,
        timestamp,
        signature,
        cloudName: cloudinary.config().cloud_name,
    });
});

app.listen(5000, () => console.log("Signature server running on port 5000"));
