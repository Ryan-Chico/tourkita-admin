// src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// fallback credentials if .env is missing
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dupjdmjha";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "479565423342763";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "1KQWvBSQ4_LBI7vGXasKVP3ZneU";

app.get("/get-signature", (req, res) => {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = crypto
        .createHash("sha1")
        .update(`timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
        .digest("hex");

    res.json({
        timestamp,
        signature,
        api_key: CLOUDINARY_API_KEY,
        cloud_name: CLOUDINARY_CLOUD_NAME,
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
