import React, { useState, useEffect, useMemo } from "react";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import "./ARUploadModal.css";

const ARUploadModal = ({ markers, assetToEdit, onClose }) => {
    const isEditMode = Boolean(assetToEdit);

    const [formData, setFormData] = useState({
        location: "",
        category: "Building",
        name: "",
        description: "",
        image: null,
        model: null,
        videoFile: null,
        physicalWidth: 0.15,
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("");

    useEffect(() => {
        if (isEditMode) {
            setFormData({
                location: assetToEdit.id,
                category: assetToEdit.category || "Building",
                name: assetToEdit.name || "",
                description: assetToEdit.description || "",
                physicalWidth: assetToEdit.physicalWidth || 0.15,
                image: null, model: null, videoFile: null,
            });
        }
    }, [assetToEdit, isEditMode]);

    // --- UPDATED LOGIC: Dropdown list is now based on the selected category ---
    const availableMarkers = useMemo(() => {
        // In Edit Mode, the dropdown is disabled, so just return all markers to ensure the current value is found.
        if (isEditMode) {
            return markers;
        }

        // In Create Mode, filter based on the category
        if (formData.category === 'Building') {
            // For a 'Building', only show locations that DO NOT have an AR asset yet.
            return markers.filter(marker => !marker.arCameraSupported);
        }

        if (formData.category === 'Relics/Artifacts') {
            // For 'Relics/Artifacts', show ALL available locations.
            return markers;
        }

        // Default to an empty array if no category is matched
        return [];
    }, [markers, isEditMode, formData.category]); // Added formData.category as a dependency

    const handleInputChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleFileChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.files[0] }));

    const uploadToFirebaseStorage = (file, path) => {
        return new Promise((resolve, reject) => {
            if (!file) { resolve(null); return; }
            const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTask.on('state_changed',
                (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                (error) => reject(error),
                () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
            );
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.location) { alert("Please select a location."); return; }
        if (!formData.name.trim()) { alert("Please enter a name."); return; }
        setIsProcessing(true);
        setStatusMessage("Starting operation...");

        const oldFileUrls = {
            image: isEditMode ? assetToEdit.imageUrl : null,
            model: isEditMode ? assetToEdit.modelUrl : null,
            video: isEditMode ? assetToEdit.videoUrl : null,
        };

        try {
            setStatusMessage("Uploading new files...");
            const newImageUrl = await uploadToFirebaseStorage(formData.image, 'models/markers');
            const newModelUrl = await uploadToFirebaseStorage(formData.model, 'models/models');
            const newVideoUrl = await uploadToFirebaseStorage(formData.videoFile, 'models/video');

            const finalData = {
                category: formData.category,
                name: formData.name,
                description: formData.description,
                imageUrl: newImageUrl || oldFileUrls.image,
                modelUrl: newModelUrl || oldFileUrls.model,
                videoUrl: newVideoUrl || oldFileUrls.video,
                physicalWidth: Number(formData.physicalWidth),
            };

            setStatusMessage("Updating database records...");
            const selectedMarker = markers.find(m => m.name === formData.location);

            await setDoc(doc(db, "arTargets", formData.location), finalData, { merge: true });
            await setDoc(doc(db, "arMarkers", formData.location), { name: formData.location, imageUrl: finalData.imageUrl }, { merge: true });

            if (selectedMarker) {
                const markerRef = doc(db, "markers", String(selectedMarker.id));
                await updateDoc(markerRef, {
                    arCameraSupported: true,
                    modelUrl: finalData.modelUrl,
                });
            }

            setStatusMessage("Cleaning up old files...");
            const filesToClean = [];
            if (newImageUrl && oldFileUrls.image) filesToClean.push(oldFileUrls.image);
            if (newModelUrl && oldFileUrls.model) filesToClean.push(oldFileUrls.model);
            if (newVideoUrl && oldFileUrls.video) filesToClean.push(oldFileUrls.video);

            const validFilesToClean = filesToClean.filter(Boolean);
            if (validFilesToClean.length > 0) {
                const cleanupPromises = validFilesToClean.map(url => deleteObject(ref(storage, url)));
                await Promise.all(cleanupPromises);
            }

            alert(`AR Asset ${isEditMode ? 'updated' : 'uploaded'} successfully!`);
            onClose();
        } catch (error) {
            console.error(error);
            alert(`Operation failed: ${error.message}. Previous data has been retained.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const renderFileInfo = (fileUrl, fileType) => fileUrl && (
        <div className="file-info">Current {fileType}: <a href={fileUrl} target="_blank" rel="noopener noreferrer">View File</a></div>
    );

    return (
        <div className="upload-modal" onClick={(e) => e.target.classList.contains("upload-modal") && onClose()}>
            <form className="upload-form" onSubmit={handleSubmit}>
                <h2>{isEditMode ? 'Edit AR Asset' : 'Upload New AR Asset'}</h2>
                <label>Category:
                    <select name="category" value={formData.category} onChange={handleInputChange} required disabled={isProcessing}>
                        <option value="Building">Building</option>
                        <option value="Relics/Artifacts">Relics/Artifacts</option>
                    </select>
                </label>
                <label>Location:
                    <select name="location" value={formData.location} onChange={handleInputChange} required disabled={isProcessing || isEditMode}>
                        <option value="">Select Location</option>
                        {availableMarkers.map(m => (<option key={m.id} value={m.name}>{m.name}</option>))}
                    </select>
                </label>
                <label>Name:
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Baluarte de San Diego" required disabled={isProcessing} />
                </label>
                <label>Description:
                    <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Enter a brief history or description..." required disabled={isProcessing}></textarea>
                </label>
                <label>Target Image: {isEditMode && <span className="label-hint">(replace current)</span>}
                    {isEditMode && renderFileInfo(assetToEdit.imageUrl, "Image")}
                    <input type="file" name="image" accept="image/jpeg,image/png" onChange={handleFileChange} required={!isEditMode} disabled={isProcessing} />
                </label>
                <label>3D Model File (.glb): {isEditMode && <span className="label-hint">(replace current)</span>}
                    {isEditMode && renderFileInfo(assetToEdit.modelUrl, "Model")}
                    <input type="file" name="model" accept=".glb,.gltf" onChange={handleFileChange} required={!isEditMode} disabled={isProcessing} />
                </label>
                <label>Video File (optional): {isEditMode && <span className="label-hint">(replace current)</span>}
                    {isEditMode && renderFileInfo(assetToEdit.videoUrl, "Video")}
                    <input type="file" name="videoFile" accept="video/mp4" onChange={handleFileChange} disabled={isProcessing} />
                </label>
                <label>Target's Physical Width (meters):
                    <input type="number" name="physicalWidth" value={formData.physicalWidth} onChange={handleInputChange} step="0.01" required disabled={isProcessing} />
                </label>
                {isProcessing && (
                    <div className="upload-status">
                        <p>{statusMessage} {statusMessage.includes("Uploading") && `${Math.round(uploadProgress)}%`}</p>
                        <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div></div>
                    </div>
                )}
                <div className="arform-actions">
                    <button type="submit" disabled={isProcessing}>{isProcessing ? 'Processing...' : (isEditMode ? 'Save Changes' : 'Submit')}</button>
                    <button type="button" onClick={onClose} disabled={isProcessing}>Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default ARUploadModal;