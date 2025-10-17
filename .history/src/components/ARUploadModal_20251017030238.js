import React, { useState, useMemo } from "react"; // 👈 Import useMemo
// --- Firebase Imports ---
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
// --- CSS ---
import "./ARUploadModal.css";

const ARUploadModal = ({ markers, onClose }) => {
    const [formData, setFormData] = useState({
        location: "",
        image: null,
        model: null,
        videoFile: null,
        physicalWidth: 0.15,
    });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    // ✨ NEW: State for a more detailed status message
    const [statusMessage, setStatusMessage] = useState("");

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData(prev => ({ ...prev, [name]: files[0] }));
    };

    // ✨ NEW: Filter the list of markers to only show those without AR support.
    // useMemo prevents re-filtering on every single render, which is more efficient.
    const availableMarkers = useMemo(() => {
        return markers.filter(marker => !marker.arCameraSupported);
    }, [markers]);


    const uploadToFirebaseStorage = (file, path, onProgress) => {
        // This function remains the same as before
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve(null);
                return;
            }
            const storageRef = ref(storage, `${path}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress(progress);
                },
                (error) => reject(error),
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then(resolve);
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
        setUploadProgress(0);
        // ✨ NEW: Set initial status message
        setStatusMessage("Uploading files...");

        try {
            const filesToUpload = [
                { file: formData.image, path: 'models/markers' },
                { file: formData.model, path: 'models/models' },
                { file: formData.videoFile, path: 'models/video' },
            ].filter(item => item.file !== null);

            const totalFiles = filesToUpload.length;
            if (totalFiles === 0) throw new Error("No files selected for upload.");

            let progressByFile = new Array(totalFiles).fill(0);

            const uploadPromises = filesToUpload.map(({ file, path }, index) =>
                uploadToFirebaseStorage(file, path, (progress) => {
                    progressByFile[index] = progress;
                    const totalProgress = progressByFile.reduce((a, b) => a + b, 0) / totalFiles;
                    setUploadProgress(totalProgress);
                })
            );

            const [imageUrl, modelUrl, videoUrl] = await Promise.all(uploadPromises);

            // ✨ NEW: Update status message after upload is complete
            setStatusMessage("Updating database...");

            const arTargetRef = doc(db, "arTargets", formData.location);
            await setDoc(arTargetRef, {
                imageUrl, modelUrl, videoUrl, physicalWidth: Number(formData.physicalWidth),
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
            setStatusMessage(""); // Reset message
        }
    };

    return (
        <div className="upload-modal" onClick={(e) => e.target.classList.contains("upload-modal") && onClose()}>
            <form className="upload-form" onSubmit={handleSubmit}>
                <h2>Upload AR Asset</h2>
                <label>
                    Location:
                    {/* 🔄 CHANGED: Maps over the new 'availableMarkers' list */}
                    <select name="location" value={formData.location} onChange={handleInputChange} required disabled={isUploading}>
                        <option value="">Select Location</option>
                        {availableMarkers.map(marker => (
                            <option key={marker.id} value={marker.name}>{marker.name}</option>
                        ))}
                    </select>
                </label>

                {/* All inputs remain disabled during upload */}
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
                    <input type="number" name="physicalWidth" value={formData.physicalWidth} onChange={handleInputChange} step="0.01" required disabled={isUploading} />
                </label>

                {/* 🔄 CHANGED: UI now shows the dynamic status message */}
                {isUploading && (
                    <div className="upload-status">
                        <p>{statusMessage}</p> {/* Shows "Uploading files..." or "Updating database..." */}
                        {/* Only show progress bar during the file upload stage */}
                        {statusMessage.startsWith("Uploading") && (
                            <div className="progress-bar-container">
                                <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                        )}
                    </div>
                )}

                <div className="arform-actions">
                    <button type="submit" disabled={isUploading}>
                        {isUploading ? 'Processing...' : 'Submit'}
                    </button>
                    <button type="button" onClick={onClose} disabled={isUploading}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default ARUploadModal;