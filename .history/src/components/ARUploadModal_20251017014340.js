import React, { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "./firebaseConfig";

export default function ARUploadForm() {
    const [markerName, setMarkerName] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [modelFile, setModelFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!markerName || !imageFile || !modelFile) {
            alert("Please complete all fields (name, image, model)");
            return;
        }

        try {
            setUploading(true);
            setSuccessMsg("");

            // 1️⃣ Upload image
            const imageRef = ref(storage, `models/markers/${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            const imageUrl = await getDownloadURL(imageRef);

            // 2️⃣ Upload model (.glb)
            const modelRef = ref(storage, `models/models/${modelFile.name}`);
            await uploadBytes(modelRef, modelFile);
            const modelUrl = await getDownloadURL(modelRef);

            // 3️⃣ Upload video (optional)
            let videoUrl = "";
            if (videoFile) {
                const videoRef = ref(storage, `models/video/${videoFile.name}`);
                await uploadBytes(videoRef, videoFile);
                videoUrl = await getDownloadURL(videoRef);
            }

            // 4️⃣ Save to Firestore
            await addDoc(collection(db, "arTargets"), {
                name: markerName,
                imageUrl,
                modelUrl,
                videoUrl,
                createdAt: serverTimestamp(),
                arCameraSupported: true,
            });

            setSuccessMsg("✅ AR Target uploaded successfully!");
            setMarkerName("");
            setImageFile(null);
            setModelFile(null);
            setVideoFile(null);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("❌ Upload failed. Check console for details.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto mt-8 p-6 bg-white shadow-md rounded-2xl">
            <h2 className="text-xl font-bold mb-4 text-center">📤 Upload AR Target</h2>

            <form onSubmit={handleUpload} className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Enter marker name"
                    value={markerName}
                    onChange={(e) => setMarkerName(e.target.value)}
                    className="border p-2 rounded"
                    required
                />

                <div>
                    <label className="block font-medium">📸 Marker Image</label>
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} required />
                </div>

                <div>
                    <label className="block font-medium">🧱 3D Model (.glb)</label>
                    <input type="file" accept=".glb" onChange={(e) => setModelFile(e.target.files[0])} required />
                </div>

                <div>
                    <label className="block font-medium">🎥 Video (optional)</label>
                    <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} />
                </div>

                <button
                    type="submit"
                    disabled={uploading}
                    className="bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {uploading ? "Uploading..." : "Upload"}
                </button>
            </form>

            {successMsg && <p className="text-green-600 text-center mt-4">{successMsg}</p>}
        </div>
    );
}
