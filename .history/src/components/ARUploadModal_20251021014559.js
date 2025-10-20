import React, { useState, useEffect, useMemo } from "react";
import { doc, setDoc, updateDoc, collection } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import "./ARUploadModal.css";

const ARUploadModal = ({ markers, arAssets, assetToEdit, onClose }) => {
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
                location: assetToEdit.locationName || "",
                category: assetToEdit.category || "Building",
                name: assetToEdit.name || "",
                description: assetToEdit.description || "",
                physicalWidth: assetToEdit.physicalWidth || 0.15,
                image: null, model: null, videoFile: null,
            });
        }
    }, [assetToEdit, isEditMode]);

    // --- UPDATED: The location list is now sorted alphabetically ---
    const availableMarkers = useMemo(() => {
        let filteredMarkers = markers;

        if (!isEditMode) {
            if (formData.category === 'Building') {
                const locationsWithBuildings = arAssets
                    .filter(asset => asset.category === 'Building')
                    .map(asset => asset.locationName);
                filteredMarkers = markers.filter(marker => !locationsWithBuildings.includes(marker.name));
            }
        }
        
        // Sort the final list of markers alphabetically by name
        return filteredMarkers.sort((a, b) => a.name.localeCompare(b.name));

    }, [markers, arAssets, isEditMode, formData.category]);

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
                locationName: formData.location,
                imageUrl: newImageUrl || oldFileUrls.image,
                modelUrl: newModelUrl || oldFileUrls.model,
                videoUrl: newVideoUrl || oldFileUrls.video,
                physicalWidth: Number(formData.physicalWidth),
            };

            setStatusMessage("Updating database records...");
            const selectedMarker = markers.find(m => m.name === formData.location);
            if (!selectedMarker) throw new Error("Selected location not found in markers list.");
            const markerRef = doc(db, "markers", String(selectedMarker.id));

            if (formData.category === 'Building') {
                const targetRef = doc(db, "arTargets", formData.location);
                await setDoc(targetRef, finalData);
                await updateDoc(markerRef, {
                    arCameraSupported: true,
                    modelUrl: finalData.modelUrl
                });
            } else if (formData.category === 'Relics/Artifacts') {
                const targetRef = isEditMode
                    ? doc(db, "arTargets", assetToEdit.id)
                    : doc(collection(db, "arTargets"));
                await setDoc(targetRef, finalData, { merge: true });
                await updateDoc(markerRef, {
                    arCameraSupported: true,
                    [`artifacts.${targetRef.id}`]: {
                        name: finalData.name,
                        modelUrl: finalData.modelUrl,
                    }
                });
            }

            // --- EXPLANATION for arMarkers ---
            // The arMarkers collection maps a LOCATION NAME to its TARGET IMAGE.
            // This is done so that the building and all its artifacts share ONE target image.
            // The app recognizes the location from this single image.
            if (finalData.imageUrl) {
                await setDoc(doc(db, "arMarkers", formData.location), {
                    name: formData.location,
                    imageUrl: finalData.imageUrl
                }, { merge: true });
            }

            setStatusMessage("Cleaning up old files...");
            const filesToClean = [
                (newImageUrl && oldFileUrls.image),
                (newModelUrl && oldFileUrls.model),
                (newVideoUrl && oldFileUrls.video)
            ].filter(Boolean);
            
            if (filesToClean.length > 0) {
                await Promise.all(filesToClean.map(url => deleteObject(ref(storage, url))));
            }

            alert(`AR Asset ${isEditMode ? 'updated' : 'uploaded'} successfully!`);
            onClose();
        } catch (error) {
            console.error(error);
            alert(`Operation failed: ${error.message}.`);
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