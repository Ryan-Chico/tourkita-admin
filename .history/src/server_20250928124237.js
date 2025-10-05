// server.js
import express from "express";
import cloudinary from "cloudinary";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// configure cloudinary
cloudinary.v2.config({
    cloud_name: "dupjdmjha",
    api_key: "479565423342763",
    api_secret: "YOUR_API_SECRET", // keep secret, never expose to frontend!
});

// endpoint to generate signature
app.get("/get-signature", (req, res) => {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.v2.utils.api_sign_request(
        { timestamp },
        cloudinary.v2.config().api_secret
    );

    res.json({
        timestamp,
        signature,
        api_key: cloudinary.v2.config().api_key,
        cloud_name: cloudinary.v2.config().cloud_name,
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));
