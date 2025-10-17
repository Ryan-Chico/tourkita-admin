import React, { useState, useEffect, useMemo } from "react";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import "./ARUploadModal.css";

const ARUploadModal = ({ markers, assetToEdit, onClose }) => {
    const isEditMode = Boolean(assetToEdit);
    const [formData, setFormData] = useState({
        location: "",
        image: null,
        model: null,
        videoFile: null,
        physicalWidth: 0.15,
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");

    // Pre-fill the form if in edit mode
    useEffect(() => {
        if (isEditMode) {
            setFormData({
                location: assetToEdit.id,
                physicalWidth: assetToEdit.physicalWidth || 0.15,
                image: null,
                model: null,
                videoFile: null,
            });
        }
    }, [assetToEdit, isEditMode]);

    const availableMarkers = useMemo(() => {
        // In edit mode, the current location should also be in the list.
        // Otherwise, filter out markers that already have AR.
        if (isEditMode) {
            return markers.filter(m => !m.arCameraSupported || m.name === assetToEdit.id);
        }
        return markers.filter(marker => !marker.arCameraSupported);
    }, [markers, isEditMode, assetToEdit]);

    const handleInputChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleFileChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.files[0] }));

    const uploadToFirebaseStorage = (file, path, onProgress) => {
        // ... (this function remains the same as before)
        return new Promise((resolve, reject) => {
            if (!file) { resolve(null); return; }
            const storageRef = ref(storage, `${path}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTask.on('state_changed',
                (snapshot) => onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                (error) => reject(error),
                () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
            );
        });
    };

    // Helper to delete old file if a new one is uploaded
    const deleteOldFile = async (oldUrl) => {
        if (!oldUrl) return;
        try {
            await deleteObject(ref(storage, oldUrl));
        } catch (error) {
            if (error.code !== 'storage/object-not-found') {
                console.error("Could not delete old file:", oldUrl, error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.location) { alert("Please select a location."); return; }
        setIsProcessing(true);
        setUploadProgress(0);
        setStatusMessage("Uploading files...");

        try {
            // Determine which files need to be uploaded
            const filesToUpload = [
                { file: formData.image, path: 'models/markers', oldUrl: assetToEdit?.imageUrl },
                { file: formData.model, path: 'models/models', oldUrl: assetToEdit?.modelUrl },
                { file: formData.videoFile, path: 'models/video', oldUrl: assetToEdit?.videoUrl },
            ];

            let progressByFile = new Array(filesToUpload.length).fill(0);

            const uploadPromises = filesToUpload.map(({ file, path }, index) =>
                uploadToFirebaseStorage(file, path, (p) => {
                    if (file) { // Only track progress for files that are actually being uploaded
                        progressByFile[index] = p;
                        const totalProgress = progressByFile.reduce((a, b) => a + b, 0) / filesToUpload.filter(f => f.file).length;
                        setUploadProgress(totalProgress);
                    }
                })
            );

            const [newImageUrl, newModelUrl, newVideoUrl] = await Promise.all(uploadPromises);

            // Delete old files that were replaced
            if (newImageUrl) await deleteOldFile(assetToEdit?.imageUrl);
            if (newModelUrl) await deleteOldFile(assetToEdit?.modelUrl);
            if (newVideoUrl) await deleteOldFile(assetToEdit?.videoUrl);

            setStatusMessage(isEditMode ? "Updating database..." : "Creating database entry...");

            const finalData = {
                imageUrl: newImageUrl || assetToEdit?.imageUrl,
                modelUrl: newModelUrl || assetToEdit?.modelUrl,
                videoUrl: newVideoUrl || assetToEdit?.videoUrl,
                physicalWidth: Number(formData.physicalWidth),
            };

            // Create or update the 'arTargets' document
            await setDoc(doc(db, "arTargets", formData.location), finalData, { merge: true });

            // Update the corresponding marker in the 'markers' collection
            const selectedMarker = markers.find(m => m.name === formData.location);
            if (selectedMarker) {
                const markerRef = doc(db, "markers", selectedMarker.id);
                await updateDoc(markerRef, {
                    arCameraSupported: true,
                    modelUrl: finalData.modelUrl
                });
            }

            alert(`AR Asset ${isEditMode ? 'updated' : 'uploaded'} successfully!`);
            onClose();

        } catch (error) {
            console.error(error);
            alert(`Operation failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper to display existing file info
    const renderFileInfo = (fileUrl, fileType) => fileUrl && (
        <div className="file-info">
            Current {fileType}: <a href={fileUrl} target="_blank" rel="noopener noreferrer">View File</a>
        </div>
    );

    return (
        <div className="upload-modal" onClick={(e) => e.target.classList.contains("upload-modal") && onClose()}>
            <form className="upload-form" onSubmit={handleSubmit}>
                <h2>{isEditMode ? 'Edit AR Asset' : 'Upload New AR Asset'}</h2>

                <label>
                    Location:
                    <select name="location" value={formData.location} onChange={handleInputChange} required disabled={isProcessing || isEditMode}>
                        <option value="">Select Location</option>
                        {availableMarkers.map(m => (<option key={m.id} value={m.name}>{m.name}</option>))}
                    </select>
                </label>

                <label>
                    Target Image: {isEditMode && <span className="label-hint">(replace current)</span>}
                    {isEditMode && renderFileInfo(assetToEdit.imageUrl, "Image")}
                    <input type="file" name="image" accept="image/jpeg,image/png" onChange={handleFileChange} required={!isEditMode} disabled={isProcessing} />
                </label>
                <label>
                    3D Model File (.glb): {isEditMode && <span className="label-hint">(replace current)</span>}
                    {isEditMode && renderFileInfo(assetToEdit.modelUrl, "Model")}
                    <input type="file" name="model" accept=".glb,.gltf" onChange={handleFileChange} required={!isEditMode} disabled={isProcessing} />
                </label>
                <label>
                    Video File (optional): {isEditMode && <span className="label-hint">(replace current)</span>}
                    {isEditMode && renderFileInfo(assetToEdit.videoUrl, "Video")}
                    <input type="file" name="videoFile" accept="video/mp4" onChange={handleFileChange} disabled={isProcessing} />
                </label>
                <label>
                    Target's Physical Width (meters):
                    <input type="number" name="physicalWidth" value={formData.physicalWidth} onChange={handleInputChange} step="0.01" required disabled={isProcessing} />
                </label>

                {isProcessing && (
                    <div className="upload-status">
                        <p>{statusMessage} {statusMessage.startsWith("Uploading") && `${Math.round(uploadProgress)}%`}</p>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    </div>
                )}

                <div className="arform-actions">
                    <button type="submit" disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : (isEditMode ? 'Save Changes' : 'Submit')}
                    </button>
                    <button type="button" onClick={onClose} disabled={isProcessing}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default ARUploadModal;
