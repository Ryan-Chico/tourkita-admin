import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./ARManagement.css";
import "@google/model-viewer";
import { FiLoader } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
// --- Import 'where' for querying ---
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc, where } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import ARUploadModal from "../components/ARUploadModal";
import ARPreviewModal from "../components/ARPreviewModal";

const SkeletonARCard = () => (<div className="marker-card skeleton-card">...</div>);
const SkeletonARList = ({ count = 8 }) => (<>...</>);

const ArManagement = () => {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [assetToEdit, setAssetToEdit] = useState(null);
    const [assetToPreview, setAssetToPreview] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [arAssets, setArAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [activeCategory, setActiveCategory] = useState("All");

    const fetchMarkers = useCallback(async () => { /* ... unchanged ... */ }, []);
    const fetchArAssets = useCallback(async () => { /* ... unchanged ... */ }, []);

    useEffect(() => {
        setIsLoading(true);
        fetchMarkers();
        fetchArAssets();
    }, [fetchMarkers, fetchArAssets]);

    const filteredAssets = useMemo(() => {
        if (activeCategory === "All") return arAssets;
        return arAssets.filter(asset => asset.category === activeCategory);
    }, [arAssets, activeCategory]);

    const handleModalClose = () => {
        setShowUploadForm(false);
        setAssetToEdit(null);
        fetchArAssets();
    };

    const handleEditClick = (e, asset) => {
        e.stopPropagation();
        setAssetToEdit(asset);
        setShowUploadForm(true);
    };

    const handlePreviewClick = (asset) => {
        setAssetToPreview(asset);
        setShowPreviewModal(true);
    };

    // --- UPDATED: Smarter deletion logic ---
    const handleDeleteClick = async (e, asset) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete the AR asset "${asset.name || asset.id}"? This cannot be undone.`)) {
            return;
        }
        setDeletingId(asset.id);
        try {
            const locationName = asset.locationName || asset.id;

            // 1. Delete the specific AR asset document
            await deleteDoc(doc(db, "arTargets", asset.id));

            // 2. Delete associated storage files (unchanged)
            const filesToDelete = [asset.imageUrl, asset.modelUrl, asset.videoUrl].filter(Boolean);
            if (filesToDelete.length > 0) {
                const deletePromises = filesToDelete.map(url => deleteObject(ref(storage, url)));
                await Promise.all(deletePromises);
            }

            // 3. Check if any OTHER AR assets remain for this location
            const q = query(collection(db, "arTargets"), where("locationName", "==", locationName));
            const remainingAssetsSnapshot = await getDocs(q);

            // 4. If no assets remain, clean up the location-specific data
            if (remainingAssetsSnapshot.empty) {
                const markerToUpdate = markers.find(m => m.name === locationName);
                if (markerToUpdate) {
                    const markerRef = doc(db, "markers", String(markerToUpdate.id));
                    await updateDoc(markerRef, { arCameraSupported: false });
                }
                // Delete the target image document
                await deleteDoc(doc(db, "arMarkers", locationName));
            }

            alert("AR Asset deleted successfully!");
            fetchArAssets();
        } catch (error) {
            console.error("Error during deletion process:", error);
            alert(`An error occurred: ${error.message}.`);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className={showUploadForm ? "dashboard-main modal-is-open" : "dashboard-main"}>
            <div className="dashboard-section">
                <Sidebar />
                <div className="page-header">
                    <h2 className="page-title">AR Asset Management</h2>
                    <p className="page-subtitle">Manage 3D models and content for locations in Intramuros.</p>
                </div>
                <div className="top-controls">
                    <div className="mtab-buttons">{/* ... tabs ... */}</div>
                    <button onClick={() => { setAssetToEdit(null); setShowUploadForm(true); }}>Add New AR Asset</button>
                </div>
                <div className="markers-list">
                    {isLoading ? <SkeletonARList /> : filteredAssets.map((asset) => (
                        <div className="marker-card" key={asset.id} onClick={() => deletingId !== asset.id && handlePreviewClick(asset)}>
                            {/* ... card content ... */}
                            <div className="marker-card-content">
                                <h4>{asset.name || asset.id}</h4>
                                <p className="asset-category">{asset.category}</p>
                                <p className="asset-description">{asset.description || 'No description available.'}</p>
                            </div>
                            <div className="card-actions">
                                <button onClick={(ev) => handleEditClick(ev, asset)} className="edit-btn" disabled={deletingId === asset.id}>Edit</button>
                                <button onClick={(ev) => handleDeleteClick(ev, asset)} className="delete-btn" disabled={deletingId === asset.id}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
                {!isLoading && filteredAssets.length === 0 && (<div className="empty-state">...</div>)}

                {/* --- UPDATED: Pass arAssets prop to the modal --- */}
                {showUploadForm && <ARUploadModal markers={markers} arAssets={arAssets} assetToEdit={assetToEdit} onClose={handleModalClose} />}

                {showPreviewModal && <ARPreviewModal asset={assetToPreview} onClose={() => setShowPreviewModal(false)} />}
            </div>
        </div>
    );
};

export default ArManagement;