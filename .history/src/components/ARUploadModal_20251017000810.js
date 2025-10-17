import React, { useState } from "react";
// Removed axios as it's not needed for Firebase Storage
import { collection, addDoc, updateDoc, doc } from "firebase/firestore"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Import necessary storage functions
import { db, storage } from "../firebase"; // Import 'storage' from firebase.js
import "./ARUploadModal.css";

// Base path for all assets in Firebase Storage
const FIREBASE_STORAGE_BASE_PATH = "models";

const ARUploadModal = ({ markers, onClose }) => {
    const [formData, setFormData] = useState({
        // Removed 'description' and 'audioFiles'
        image: null,
        model: null,
        videoFiles: [],
        location: "", 
        // Adding a state for loading/upload status
        isUploading: false,
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (name === "videoFiles") {
            // Only taking the first file if multiple are selected for simplicity (matching DB structure)
            setFormData(prev => ({ ...prev, [name]: files.length ? [files[0]] : [] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    // 🆕 Function to upload file to Firebase Storage
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
            alert(`Upload failed for ${file.name}: ${error.message}`);
            throw error; // Re-throw to stop the handleSubmit process
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormData(prev => ({ ...prev, isUploading: true })); // Start loading
        
        try {
            // 1. Upload Assets to Firebase Storage with specific folder structure
            const imageUrl = formData.image 
                ? await uploadToFirebase(formData.image, "markers") 
                : null;
                
            const modelUrl = formData.model 
                ? await uploadToFirebase(formData.model, "models") 
                : null;
            
            // Upload only the first video file (if available)
            const videoFile = formData.videoFiles[0];
            const videoUrl = videoFile 
                ? await uploadToFirebase(videoFile, "video") 
                : null;

            // 2. Save AR Asset Metadata in Firestore to the 'arTargets' collection
            // The document ID will be automatically generated.
            await addDoc(collection(db, "arTargets"), {
                // 'id' is typically the document ID, but we'll use 'name' as a field
                name: formData.location, // e.g., "Puerta de Parian"
                imageUrl: imageUrl,       // Target image link
                modelUrl: modelUrl,       // 3D Model (.glb) link
                videoUrl: videoUrl,       // Video link
                physicalWidth: 0.15,      // Hardcoded value
                // Removed description, audioUrls, createdAt to match the requested structure
            });

            // 3. Update marker in Firestore
            const selectedMarker = markers.find(m => m.name === formData.location);
            if (selectedMarker) {
                // NOTE: The request specified the collection name "arMarkers",
                // but the existing app code uses "markers".
                // I am using "markers" to maintain compatibility with your component's props.
                // Change "markers" to "arMarkers" if you update your database structure.
                const markerRef = doc(db, "markers", selectedMarker.id); 
                
                await updateDoc(markerRef, { 
                    arCameraSupported: true 
                });
            }

            alert("AR Asset uploaded successfully to Firebase!");
            onClose();
        } catch (error) {
            // Error handling is inside uploadToFirebase, but catching here too for final status
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
                {/* The 'Description' and 'Audio' inputs were removed 
                as they are not part of the final requested Firestore structure. 
                */}
            </form>
        </div>
    );
};

export default ARUploadModal;