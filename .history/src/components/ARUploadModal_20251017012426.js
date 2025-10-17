import React, { useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Make sure you export 'storage' from your firebase config file alongside 'db'
import { db, storage } from '../firebase';
import './ARUploadModal.css';

const ARUploadModal = ({ markers, onClose }) => {
    const [formData, setFormData] = useState({
        location: '',
        image: null, // For the target marker image (.jpg)
        model: null, // For the 3D model (.glb)
        video: null, // For the video file (.mp4)
        physicalWidth: 0.15,
    });
    const [isUploading, setIsUploading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    /**
     * A helper function to upload a file to a specific path in Firebase Storage.
     * @param {File} file The file to upload.
     * @param {string} path The destination path in Firebase Storage.
     * @returns {Promise<string|null>} The download URL of the uploaded file.
     */
    const uploadFile = async (file, path) => {
        if (!file) return null;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.location || !formData.image || !formData.model) {
            alert('Please select a location and provide the required target image and 3D model files.');
            return;
        }

        setIsUploading(true);
        try {
            // 1️⃣ Upload files to Firebase Storage and get their URLs
            const [imageUrl, modelUrl, videoUrl] = await Promise.all([
                uploadFile(formData.image, `models/markers/${formData.image.name}`),
                uploadFile(formData.model, `models/models/${formData.model.name}`),
                uploadFile(formData.video, `models/video/${formData.video.name}`)
            ]);

            // 2️⃣ Prepare the data object for the 'arTargets' collection
            const arTargetData = {
                imageUrl,
                modelUrl,
                physicalWidth: Number(formData.physicalWidth),
                ...(videoUrl && { videoUrl }), // Only include videoUrl if it exists
            };

            // 3️⃣ Create a new document in 'arTargets' with the location name as the ID
            await setDoc(doc(db, 'arTargets', formData.location), arTargetData);

            // 4️⃣ Find the corresponding marker in the 'markers' collection and update it
            const selectedMarker = markers.find(m => m.name === formData.location);
            if (selectedMarker) {
                const markerRef = doc(db, 'markers', selectedMarker.id);
                await updateDoc(markerRef, { arCameraSupported: true });
            }

            alert('AR Target uploaded and marker updated successfully!');
            onClose();

        } catch (error) {
            console.error("Error uploading AR asset:", error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="upload-modal" onClick={(e) => e.target.classList.contains("upload-modal") && onClose()}>
            <form className="upload-form" onSubmit={handleSubmit}>
                <h2>Upload AR Target</h2>

                <label>
                    Location (Marker Name):
                    <select name="location" value={formData.location} onChange={handleInputChange} required>
                        <option value="">Select Location</option>
                        {markers.map(marker => (
                            <option key={marker.id} value={marker.name}>{marker.name}</option>
                        ))}
                    </select>
                </label>

                <label>
                    Target Image (for recognition):
                    <input type="file" name="image" accept="image/jpeg,image/png" onChange={handleFileChange} required />
                </label>

                <label>
                    3D Model File (.glb):
                    <input type="file" name="model" accept=".glb,.gltf" onChange={handleFileChange} required />
                </label>

                <label>
                    Associated Video (optional):
                    <input type="file" name="video" accept="video/mp4" onChange={handleFileChange} />
                </label>

                <label>
                    Physical Width of Target (meters):
                    <input
                        type="number"
                        name="physicalWidth"
                        value={formData.physicalWidth}
                        onChange={handleInputChange}
                        step="0.01"
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