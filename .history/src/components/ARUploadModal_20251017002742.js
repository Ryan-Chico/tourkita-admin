    import React, { useState } from "react";
    import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
    import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
    import { getAuth } from "firebase/auth"; // Import getAuth for checking authentication
    import { db, storage } from "../firebase"; // Import 'db' and 'storage'
    import "./ARUploadModal.css";

    // Base path for all assets in Firebase Storage
    const FIREBASE_STORAGE_BASE_PATH = "models";

    const ARUploadModal = ({ markers, onClose }) => {
        const [formData, setFormData] = useState({
            image: null,
            model: null,
            videoFiles: [], // Only takes the first file for DB storage
            location: "",   // Used as the 'name' field in arTargets
            isUploading: false,
        });

        const handleInputChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleFileChange = (e) => {
            const { name, files } = e.target;
            if (name === "videoFiles") {
                // Only taking the first file
                setFormData(prev => ({ ...prev, [name]: files.length ? [files[0]] : [] }));
            } else {
                setFormData(prev => ({ ...prev, [name]: files[0] }));
            }
        };

        /**
         * Uploads a file to Firebase Storage in a specific subfolder.
         * @param {File} file - The file to upload.
         * @param {string} subFolder - The folder inside 'models' (e.g., 'markers', 'models', 'video').
         * @returns {Promise<string|null>} The public download URL or null if no file.
         */
        const uploadToFirebase = async (file, subFolder) => {
            if (!file) return null;

            // Construct the full path: models/{subFolder}/{filename}
            const filePath = `${FIREBASE_STORAGE_BASE_PATH}/${subFolder}/${file.name}`;
            const storageRef = ref(storage, filePath);

            try {
                // Upload the file
                const snapshot = await uploadBytes(storageRef, file);
                // Get the public download URL
                const url = await getDownloadURL(snapshot.ref);
                return url;
            } catch (error) {
                console.error("Firebase Storage Upload Error:", error);
                alert(`Upload failed for ${file.name}. Please check storage permissions. Error: ${error.message}`);
                throw error; // Re-throw to stop the handleSubmit process
            }
        };

        const handleSubmit = async (e) => {
            e.preventDefault();

            // 🚨 CRITICAL: Check Authentication 🚨
            const auth = getAuth();
            if (!auth.currentUser) {
                alert("Upload failed: You must be logged in to upload assets.");
                return;
            }

            setFormData(prev => ({ ...prev, isUploading: true })); // Start loading

            try {
                // 1. Upload Assets to Firebase Storage (models/markers, models/models, models/video)
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

                // 2. Save AR Asset Metadata in Firestore to the 'arTargets' collection
                await addDoc(collection(db, "arTargets"), {
                    name: formData.location,        // Link name/Marker Name
                    imageUrl: imageUrl,             // Target image URL
                    modelUrl: modelUrl,             // 3D Model (.glb) URL
                    videoUrl: videoUrl,             // Video URL
                    physicalWidth: 0.15,            // Hardcoded value (0.15 meters)
                });

                // 3. Update marker in Firestore to enable AR support
                const selectedMarker = markers.find(m => m.name === formData.location);
                if (selectedMarker) {
                    // NOTE: Using 'markers' collection. Change to 'arMarkers' if you rename the DB collection.
                    const markerRef = doc(db, "markers", selectedMarker.id);

                    await updateDoc(markerRef, {
                        arCameraSupported: true
                    });
                }

                alert("AR Asset uploaded successfully to Firebase!");
                onClose();
            } catch (error) {
                console.error("Submission Error:", error);
            } finally {
                setFormData(prev => ({ ...prev, isUploading: false })); // Stop loading
            }
        };

        return (
            <div className="upload-modal" onClick={(e) => e.target.classList.contains("upload-modal") && onClose()}>
                <form className="upload-form" onSubmit={handleSubmit}>
                    <h2>Upload AR Asset (Firebase)</h2>

                    <label>
                        Location:
                        <select name="location" value={formData.location} onChange={handleInputChange} required>
                            <option value="">Select Location</option>
                            {markers.map(marker => (
                                <option key={marker.id} value={marker.name}>{marker.name}</option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Target Image (Marker - .jpg):
                        <input type="file" name="image" accept="image/jpeg" onChange={handleFileChange} required />
                    </label>

                    <label>
                        3D Model File (.glb):
                        <input type="file" name="model" accept=".glb" onChange={handleFileChange} required />
                    </label>

                    <label>
                        Video File (.mp4):
                        <input type="file" name="videoFiles" accept="video/mp4" onChange={handleFileChange} />
                    </label>

                    <div className="arform-actions">
                        <button type="submit" disabled={formData.isUploading}>
                            {formData.isUploading ? "Uploading..." : "Submit"}
                        </button>
                        <button type="button" onClick={onClose} disabled={formData.isUploading}>Cancel</button>
                    </div>
                </form>
            </div>
        );
    };

    export default ARUploadModal;