import React, { useState } from "react";
// --- Firebase Imports (uploadBytesResumable is the key change) ---
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
// --- CSS ---
import "./ARUploadModal.css";

const ARUploadModal = ({ markers, onClose }) => {
    const [formData, setFormData] = useState({
        description: "",
        image: null,
        model: null,
        videoFile: null,
        location: "",
        physicalWidth: 0.15,
    });
    const [isUploading, setIsUploading] = useState(false);
    // ✨ NEW: State to hold the overall upload percentage
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData(prev => ({ ...prev, [name]: files[0] }));
    };

    // --- 🔄 CHANGED: This function now uses uploadBytesResumable and accepts a progress callback ---
    const uploadToFirebaseStorage = (file, path, onProgress) => {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve(null);
                return;
            }
            const storageRef = ref(storage, `${path}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    // This is the progress tracking part
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(progress); // Call the callback with the current progress
                },
                (error) => {
                    // Handle unsuccessful uploads
                    console.error(`Upload Error for ${file.name}:`, error);
                    reject(error);
                },
                () => {
                    // Handle successful uploads on complete
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        resolve(downloadURL);
                    });
                }
            );
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.location) {
            alert("Please select a location.");
            return;
        }
        setIsUploading(true);
        setUploadProgress(0); // Reset progress on new submission

        try {
            const filesToUpload = [
                { file: formData.image, path: 'models/markers' },
                { file: formData.model, path: 'models/models' },
                { file: formData.videoFile, path: 'models/video' },
            ].filter(item => item.file !== null); // Filter out any empty file inputs

            const totalFiles = filesToUpload.length;
            if (totalFiles === 0) {
                throw new Error("No files selected for upload.");
            }

            let progressByFile = new Array(totalFiles).fill(0);

            const uploadPromises = filesToUpload.map(({ file, path }, index) =>
                uploadToFirebaseStorage(file, path, (progress) => {
                    progressByFile[index] = progress;
                    // Calculate the average progress across all files
                    const totalProgress = progressByFile.reduce((acc, curr) => acc + curr, 0) / totalFiles;
                    setUploadProgress(totalProgress);
                })
            );

            // Wait for all uploads to complete
            const [imageUrl, modelUrl, videoUrl] = await Promise.all(uploadPromises);

            const arTargetRef = doc(db, "arTargets", formData.location);
            await setDoc(arTargetRef, {
                imageUrl: imageUrl,
                modelUrl: modelUrl,
                videoUrl: videoUrl,
                physicalWidth: Number(formData.physicalWidth),
            });

            const selectedMarker = markers.find(m => m.name === formData.location);
            if (selectedMarker) {
                const markerRef = doc(db, "markers", selectedMarker.id);
                await updateDoc(markerRef, {
                    arCameraSupported: true,
                    modelUrl: modelUrl
                });
            }

            alert("AR Asset uploaded and linked successfully!");
            onClose();
        } catch (error) {
            console.error(error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="upload-modal" onClick={(e) => e.target.classList.contains("upload-modal") && onClose()}>
            <form className="upload-form" onSubmit={handleSubmit}>
                <h2>Upload AR Asset</h2>

                <label>
                    Location:
                    {/* 🔒 DISABLED when uploading */}
                    <select name="location" value={formData.location} onChange={handleInputChange} required disabled={isUploading}>
                        <option value="">Select Location</option>
                        {markers.map(marker => (
                            <option key={marker.id} value={marker.name}>{marker.name}</option>
                        ))}
                    </select>
                </label>

                {/* All inputs are now disabled during upload */}
                <label>
                    Target Image (for tracking):
                    <input type="file" name="image" accept="image/jpeg,image/png" onChange={handleFileChange} required disabled={isUploading} />
                </label>
                <label>
                    3D Model File (.glb):
                    <input type="file" name="model" accept=".glb,.gltf" onChange={handleFileChange} required disabled={isUploading} />
                </label>
                <label>
                    Video File (optional):
                    <input type="file" name="videoFile" accept="video/mp4" onChange={handleFileChange} disabled={isUploading} />
                </label>
                <label>
                    Target's Physical Width (meters):
                    <input
                        type="number"
                        name="physicalWidth"
                        value={formData.physicalWidth}
                        onChange={handleInputChange}
                        step="0.01"
                        required
                        disabled={isUploading}
                    />
                </label>

                {/* 📊 NEW: Progress bar and status text */}
                {isUploading && (
                    <div className="upload-status">
                        <p>Uploading... {Math.round(uploadProgress)}%</p>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    </div>
                )}

                <div className="arform-actions">
                    {/* Buttons are also disabled */}
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