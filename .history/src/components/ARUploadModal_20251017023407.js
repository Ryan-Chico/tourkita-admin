import React, { useState } from "react";
// --- Firebase Imports ---
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase"; // Make sure to export 'storage' from this file
// --- CSS ---
import "./ARUploadModal.css";

const ARUploadModal = ({ markers, onClose }) => {
    // Added physicalWidth to the form state
    const [formData, setFormData] = useState({
        description: "",
        image: null,      // Target image for 'markers/'
        model: null,      // 3D model for 'models/'
        videoFile: null,  // Single video for 'video/'
        location: "",
        physicalWidth: 0.15, // New field with default value
    });
    const [isUploading, setIsUploading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        // Handle single file uploads
        setFormData(prev => ({ ...prev, [name]: files[0] }));
    };

    // --- New upload function for Firebase Storage ---
    const uploadToFirebaseStorage = async (file, path) => {
        if (!file) return null; // Return null if no file is provided
        // Create a storage reference with a specific path and filename
        const storageRef = ref(storage, `${path}/${file.name}`);
        try {
            // Upload the file
            const snapshot = await uploadBytes(storageRef, file);
            // Get the public download URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            throw error; // Propagate the error to the handler
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.location) {
            alert("Please select a location.");
            return;
        }
        setIsUploading(true);

        try {
            // --- Upload files to their respective folders in Firebase Storage ---
            const imageUrl = await uploadToFirebaseStorage(formData.image, 'models/markers');
            const modelUrl = await uploadToFirebaseStorage(formData.model, 'models/models');
            const videoUrl = await uploadToFirebaseStorage(formData.videoFile, 'models/video');

            // --- 1. Create or update the document in the 'arTargets' collection ---
            // The document ID will be the name of the location (e.g., "Puerta de Parian")
            const arTargetRef = doc(db, "arTargets", formData.location);

            await setDoc(arTargetRef, {
                imageUrl: imageUrl,
                modelUrl: modelUrl,
                videoUrl: videoUrl,
                physicalWidth: Number(formData.physicalWidth), // Ensure it's stored as a number
            });

            // --- 2. Update the 'arCameraSupported' field in the 'Markers' collection ---
            const selectedMarker = markers.find(m => m.name === formData.location);
            if (selectedMarker) {
                const markerRef = doc(db, "Markers", selectedMarker.id);
                await updateDoc(markerRef, {
                    arCameraSupported: true
                });
            }

            alert("AR Asset uploaded and linked successfully!");
            onClose(); // Close the modal on success
        } catch (error) {
            console.error(error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false); // Re-enable the submit button
        }
    };

    return (
        <div className="upload-modal" onClick={(e) => e.target.classList.contains("upload-modal") && onClose()}>
            <form className="upload-form" onSubmit={handleSubmit}>
                <h2>Upload AR Asset</h2>

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
                    Target Image (for tracking):
                    <input type="file" name="image" accept="image/jpeg,image/png" onChange={handleFileChange} required />
                </label>

                <label>
                    3D Model File (.glb):
                    <input type="file" name="model" accept=".glb,.gltf" onChange={handleFileChange} required />
                </label>

                <label>
                    Video File (optional):
                    {/* Removed 'multiple' to match the single videoUrl schema */}
                    <input type="file" name="videoFile" accept="video/mp4" onChange={handleFileChange} />
                </label>

                <label>
                    Target's Physical Width (meters):
                    <input
                        type="number"
                        name="physicalWidth"
                        value={formData.physicalWidth}
                        onChange={handleInputChange}
                        step="0.01" // Allows decimal input
                        required
                    />
                </label>

                <div className="arform-actions">
                    <button type="submit" disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Submit'}
                    </button>
                    <button type="button" onClick={onClose} disabled={isUploading}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default ARUploadModal;