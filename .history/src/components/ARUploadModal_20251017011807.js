import React, { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { storage } from "../firebase"; // Assuming your firebase.js is one directory up

// The base path in your bucket. The files will go to: models/uploads/{filename}
const FIREBASE_UPLOAD_PATH = "models/uploads";

const SimpleUploadForm = () => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) {
            setUploadMessage("Please select a file first.");
            return;
        }

        // 1. Check Authentication
        const auth = getAuth();
        if (!auth.currentUser) {
            setUploadMessage("Upload failed: You must be logged in.");
            return;
        }

        setIsUploading(true);
        setUploadMessage("Starting upload...");

        // Construct the full path: models/uploads/{filename}
        const filePath = `${FIREBASE_UPLOAD_PATH}/${file.name}`;
        const storageRef = ref(storage, filePath);

        try {
            // 2. Upload the file
            const snapshot = await uploadBytes(storageRef, file);
            setUploadMessage(`File uploaded successfully! Getting download URL...`);

            // 3. Get the public download URL
            const url = await getDownloadURL(snapshot.ref);

            setUploadMessage(
                `✅ Success! File URL: ${url}. (Check Firebase Storage for file.)`
            );

        } catch (error) {
            console.error("Firebase Storage Upload Error:", error);
            // This is where your previous 'retry-limit-exceeded' error would show up.
            setUploadMessage(`❌ Upload failed. Error: ${error.message}. Check console and storage rules/CORS.`);
        } finally {
            setIsUploading(false);
            setFile(null); // Clear the file input state
            document.getElementById("file-input").value = ''; // Clear file input field
        }
    };

    return (
        <div style={{ padding: "20px", border: "1px solid #ccc", maxWidth: "400px", margin: "50px auto" }}>
            <h2>Upload to Firebase Bucket</h2>
            <form onSubmit={handleUpload}>
                <input
                    id="file-input"
                    type="file"
                    onChange={handleFileChange}
                    required
                    style={{ marginBottom: "15px" }}
                />
                <button
                    type="submit"
                    disabled={isUploading || !file}
                    style={{ padding: "10px 20px" }}
                >
                    {isUploading ? "Uploading..." : `Upload ${file ? file.name : 'File'}`}
                </button>
            </form>
            <p style={{ marginTop: "20px", color: isUploading ? 'blue' : (uploadMessage.startsWith('❌') ? 'red' : 'green') }}>
                {uploadMessage}
            </p>
        </div>
    );
};

export default SimpleUploadForm;