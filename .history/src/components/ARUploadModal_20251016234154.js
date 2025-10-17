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

    // ✅ Handle input text/select change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // ✅ Handle file change
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData((prev) => ({ ...prev, [name]: files[0] }));
        console.log(`File selected for ${name}:`, files[0]);
    };

    // ✅ Upload helper with detailed logging
    // ✅ Upload helper with extended retry & timeout disabled
    const uploadToFirebase = (file, folder) => {
        return new Promise((resolve, reject) => {
            if (!file) {
                console.warn(`No file provided for folder: ${folder}`);
                resolve(null);
                return;
            }

            const uniqueName = `${Date.now()}_${file.name}`;
            const storageRef = ref(storage, `${folder}/${uniqueName}`);

            console.log(`📤 Starting upload: ${file.name} → ${folder}`);

            // ⚡ Extend retry times for large files
            const uploadTask = uploadBytesResumable(storageRef, file, {
                customMetadata: { uploadedAt: new Date().toISOString() },
                maxRetryTime: Number.MAX_SAFE_INTEGER, // practically infinite
            });

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const prog =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(prog.toFixed(0));
                    console.log(`Progress (${folder}): ${prog.toFixed(0)}%`);
                },
                (error) => {
                    console.error("❌ Upload error:", error);
                    reject(error);
                },
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    console.log(`✅ Upload complete for ${folder}:`, url);
                    resolve(url);
                }
            );
        });
    };


    // ✅ Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.image || !formData.model || !formData.location) {
            alert("Please complete all required fields.");
            return;
        }

        console.log("🧾 Form Data:", formData);

        try {
            setUploading(true);
            setProgress(0);

            const [imageUrl, modelUrl, videoUrl] = await Promise.all([
                uploadToFirebase(formData.image, "markers"),
                uploadToFirebase(formData.model, "models"),
                formData.video
                    ? uploadToFirebase(formData.video, "videos")
                    : Promise.resolve(null),
            ]);

            console.log("✅ All uploads complete", {
                imageUrl,
                modelUrl,
                videoUrl,
            });

            // 🔹 Save to Firestore: arTargets
            await setDoc(doc(db, "arTargets", formData.location), {
                id: formData.location,
                description: formData.description,
                imageUrl,
                modelUrl,
                videoUrl,
                physicalWidth: parseFloat(formData.physicalWidth),
                createdAt: serverTimestamp(),
            });

            // 🔹 Optional: add record to arMarkers
            await addDoc(collection(db, "arMarkers"), {
                name: formData.location,
                description: formData.description,
                imageUrl,
                modelUrl,
                videoUrl,
                createdAt: serverTimestamp(),
            });

            // 🔹 Update the selected marker to show AR support
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
                console.log("📍 Marker updated:", selectedMarker.name);
            }

            alert("✅ AR Target uploaded successfully!");
            onClose();
        } catch (err) {
            console.error("🔥 Upload failed:", err);
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
                            .filter((m) => !m.arCameraSupported)
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
