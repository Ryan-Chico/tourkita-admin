// ARUploadModal.js
import React, { useState } from "react";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { db, storage } from "../firebase";
import "./ARUploadModal.css";

const FIREBASE_STORAGE_BASE_PATH = "models";

const ARUploadModal = ({ markers, onClose }) => {
    const [formData, setFormData] = useState({
        image: null,
        model: null,
        videoFiles: [],
        location: "",
        isUploading: false,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (name === "videoFiles") {
            setFormData((prev) => ({
                ...prev,
                [name]: files.length ? [files[0]] : [],
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: files[0] }));
        }
    };

    const uploadToFirebase = async (file, subFolder) => {
        if (!file) return null;

        const filePath = `${FIREBASE_STORAGE_BASE_PATH}/${subFolder}/${file.name}`;
        const storageRef = ref(storage, filePath);

        try {
            console.log(`📤 Uploading ${file.name} to ${filePath}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            console.log(`✅ Uploaded: ${url}`);
            return url;
        } catch (error) {
            console.error("❌ Firebase Storage Upload Error:", error);
            alert(`Upload failed for ${file.name}: ${error.message}`);
            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const auth = getAuth();
        if (!auth.currentUser) {
            console.warn("⚠️ No user logged in. Uploading as guest (for testing only).");
        }

        setFormData((prev) => ({ ...prev, isUploading: true }));

        try {
            // 1️⃣ Upload to Firebase Storage
            const imageUrl = formData.image
                ? await uploadToFirebase(formData.image, "markers")
                : null;
            const modelUrl = formData.model
                ? await uploadToFirebase(formData.model, "models")
                : null;
            const videoFile = formData.videoFiles[0];
            const videoUrl = videoFile
                ? await uploadToFirebase(videoFile, "video")
                : null;

            // 2️⃣ Save metadata to Firestore (arMarkers)
            const arDocRef = await addDoc(collection(db, "arMarkers"), {
                name: formData.location,
                imageUrl,
                modelUrl,
                videoUrl,
                physicalWidth: 0.15,
                createdAt: new Date(),
            });
            console.log("📝 Firestore: AR marker document created with ID:", arDocRef.id);

            // 3️⃣ Update marker (if exists) in markers collection
            const selectedMarker = markers.find((m) => m.name === formData.location);
            if (selectedMarker && selectedMarker.id) {
                const markerRef = doc(db, "markers", selectedMarker.id);
                await updateDoc(markerRef, { arCameraSupported: true });
                console.log("🔄 Marker updated:", selectedMarker.name);
            } else {
                console.warn("⚠️ No matching marker found for:", formData.location);
            }

            alert("✅ AR Asset uploaded successfully!");
            onClose();
        } catch (error) {
            console.error("❌ Upload process failed:", error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setFormData((prev) => ({ ...prev, isUploading: false }));
        }
    };

    return (
        <div
            className="upload-modal"
            onClick={(e) =>
                e.target.classList.contains("upload-modal") && onClose()
            }
        >
            <form className="upload-form" onSubmit={handleSubmit}>
                <h2>Upload AR Asset (Firebase)</h2>

                <label>
                    Location:
                    <select
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Select Location</option>
                        {markers.map((marker) => (
                            <option key={marker.id} value={marker.name}>
                                {marker.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Target Image (.jpg):
                    <input
                        type="file"
                        name="image"
                        accept="image/jpeg"
                        onChange={handleFileChange}
                        required
                    />
                </label>

                <label>
                    3D Model (.glb):
                    <input
                        type="file"
                        name="model"
                        accept=".glb"
                        onChange={handleFileChange}
                        required
                    />
                </label>

                <label>
                    Video (.mp4) — optional:
                    <input
                        type="file"
                        name="videoFiles"
                        accept="video/mp4"
                        onChange={handleFileChange}
                    />
                </label>

                <div className="arform-actions">
                    <button type="submit" disabled={formData.isUploading}>
                        {formData.isUploading ? "Uploading..." : "Submit"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={formData.isUploading}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ARUploadModal;
