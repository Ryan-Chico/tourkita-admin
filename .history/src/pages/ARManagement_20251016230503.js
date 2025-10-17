import React, { useState } from "react";
import { db, storage } from "../firebase";
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
} from "firebase/storage";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import "./ARUploadModal.css";

const ARUploadModal = ({ markers, onClose }) => {
    const [formData, setFormData] = useState({
        description: "",
        image: null,
        model: null,
        video: null,
        location: "",
        physicalWidth: 0.15,
    });

    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData((prev) => ({ ...prev, [name]: files[0] }));
    };

    const uploadToFirebase = (file, folder) => {
        return new Promise((resolve, reject) => {
            const storageRef = ref(storage, `models/${folder}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const prog =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(prog.toFixed(0));
                },
                (error) => reject(error),
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(url);
                }
            );
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.image || !formData.model || !formData.location) {
            alert("Please complete all required fields.");
            return;
        }

        try {
            setUploading(true);
            setProgress(0);

            const [imageUrl, modelUrl, videoUrl] = await Promise.all([
                formData.image
                    ? uploadToFirebase(formData.image, "markers")
                    : Promise.resolve(null),
                formData.model
                    ? uploadToFirebase(formData.model, "models")
                    : Promise.resolve(null),
                formData.video
                    ? uploadToFirebase(formData.video, "video")
                    : Promise.resolve(null),
            ]);

            // 1️⃣ Save to Firestore collection: arTargets
            await setDoc(doc(db, "arTargets", formData.location), {
                id: formData.location,
                imageUrl,
                modelUrl,
                videoUrl,
                physicalWidth: parseFloat(formData.physicalWidth),
                createdAt: serverTimestamp(),
            });

            // 2️⃣ Optionally log it in arMarkers for listing
            await addDoc(collection(db, "arMarkers"), {
                name: formData.location,
                imageUrl,
                modelUrl,
                videoUrl,
                createdAt: serverTimestamp(),
            });

            // 3️⃣ Update Marker (set AR support true)
            const selectedMarker = markers.find(
                (m) => m.name === formData.location
            );
            if (selectedMarker) {
                const markerRef = doc(db, "markers", selectedMarker.id);
                await updateDoc(markerRef, {
                    arCameraSupported: true,
                    imageUrl,
                    modelUrl,
                });
            }

            alert("✅ AR Target uploaded successfully!");
            onClose();
        } catch (err) {
            console.error(err);
            alert("Upload failed: " + err.message);
        } finally {
            setUploading(false);
            setProgress(0);
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
                <h2>Upload AR Target</h2>

                <label>
                    Location:
                    <select
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Select Location</option>
                        {markers
                            .filter((m) => !m.arCameraSupported) // ✅ show only those w/o AR
                            .map((marker) => (
                                <option key={marker.id} value={marker.name}>
                                    {marker.name}
                                </option>
                            ))}
                    </select>
                </label>

                <label>
                    Description:
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                    />
                </label>

                <label>
                    Target Image (.jpg):
                    <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                    />
                </label>

                <label>
                    3D Model (.glb, .gltf):
                    <input
                        type="file"
                        name="model"
                        accept=".glb,.gltf"
                        onChange={handleFileChange}
                        required
                    />
                </label>

                <label>
                    AR Video (optional):
                    <input
                        type="file"
                        name="video"
                        accept="video/*"
                        onChange={handleFileChange}
                    />
                </label>

                <label>
                    Physical Width (m):
                    <input
                        type="number"
                        name="physicalWidth"
                        step="0.01"
                        value={formData.physicalWidth}
                        onChange={handleInputChange}
                        required
                    />
                </label>

                {uploading && (
                    <div className="progress-bar">
                        <p>Uploading... {progress}%</p>
                        <div className="bar">
                            <div
                                className="fill"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <div className="arform-actions">
                    <button type="submit" disabled={uploading}>
                        {uploading ? "Uploading..." : "Submit"}
                    </button>
                    <button type="button" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ARUploadModal;
