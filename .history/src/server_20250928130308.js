const CLOUDINARY_CLOUD_NAME = "dupjdmjha";
const CLOUDINARY_API_KEY = "479565423342763";
const CLOUDINARY_API_SECRET = "1KQWvBSQ4_LBI7vGXasKVP3ZneU";

app.get("/get-signature", (req, res) => {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const crypto = require("crypto");
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
