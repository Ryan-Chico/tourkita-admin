import React, { useState, useEffect, useCallback } from "react";
import "./ARManagement.css";
import { FiEdit, FiTrash2, FiPlusCircle } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase"; // Make sure to export 'storage' from your firebase.js
import ARUploadModal from "../components/ARUploadModal";

const ArManagement = () => {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [assetToEdit, setAssetToEdit] = useState(null); // State to hold the asset being edited
    const [markers, setMarkers] = useState([]);
    const [arAssets, setArAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMarkers = useCallback(async () => {
        try {
            const snapshot = await getDocs(collection(db, "markers"));
            const markersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMarkers(markersData);
        } catch (error) {
            console.error("Error fetching markers:", error);
        }
    }, []);

    const fetchArAssets = useCallback(async () => {
        try {
            const assetsQuery = query(collection(db, "arTargets"), orderBy("__name__"));
            const snapshot = await getDocs(assetsQuery);
            const assetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setArAssets(assetsData);
        } catch (error) {
            console.error("Error fetching AR assets:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetchMarkers();
        fetchArAssets();
    }, [fetchMarkers, fetchArAssets]);

    // This handler now also resets the editing state
    const handleModalClose = () => {
        setShowUploadForm(false);
        setAssetToEdit(null);
        fetchArAssets(); // Refresh assets after modal closes
    };

    // Handler to open the modal for editing an asset
    const handleEditClick = (asset) => {
        setAssetToEdit(asset);
        setShowUploadForm(true);
    };

    // Handler to delete an asset
    const handleDeleteClick = async (asset) => {
        if (!window.confirm(`Are you sure you want to delete the AR asset for "${asset.id}"? This action cannot be undone.`)) {
            return;
        }

        setIsLoading(true);
        try {
            // 1. Delete files from Firebase Storage
            const fileUrls = [asset.imageUrl, asset.modelUrl, asset.videoUrl].filter(Boolean);
            const deletePromises = fileUrls.map(url => deleteObject(ref(storage, url)));
            await Promise.all(deletePromises);

            // 2. Delete the document from 'arTargets' collection
            await deleteDoc(doc(db, "arTargets", asset.id));

            // 3. Update the corresponding marker in the 'markers' collection
            const markerToUpdate = markers.find(m => m.name === asset.id);
            if (markerToUpdate) {
                const markerRef = doc(db, "markers", markerToUpdate.id);
                await updateDoc(markerRef, {
                    arCameraSupported: false,
                    modelUrl: "" // Set modelUrl to empty or delete it
                });
            }

            alert("AR Asset deleted successfully!");
            fetchArAssets(); // Refresh the list
            fetchMarkers();  // Refresh markers state

        } catch (error) {
            console.error("Error deleting AR asset:", error);
            alert(`Failed to delete asset. Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="dashboard-main">
            <Sidebar />
            <div className="dashboard-section">
                <div className="ar-header">
                    <h2 className="ar-title">AR Asset Management</h2>
                    <p className="ar-subtitle">Manage 3D models and content for locations in Obando.</p>
                </div>

                <div className="ar-top-controls">
                    <button onClick={() => { setAssetToEdit(null); setShowUploadForm(true); }}>
                        <FiPlusCircle style={{ marginRight: "8px", verticalAlign: "middle" }} />
                        Add New AR Asset
                    </button>
                </div>

                {isLoading ? (
                    <p>Loading assets...</p>
                ) : (
                    <div className="ar-grid">
                        {arAssets.map((asset) => (
                            <div className="ar-card" key={asset.id}>
                                <div className="ar-card-image">
                                    <img
                                        src={asset.imageUrl}
                                        alt={asset.id}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                                <h3>{asset.id}</h3>
                                <p className="ar-card-meta">Width: {asset.physicalWidth}m</p>
                                <div className="ar-card-links">
                                    <a href={asset.modelUrl} target="_blank" rel="noopener noreferrer">View Model</a>
                                    {asset.videoUrl && (
                                        <a href={asset.videoUrl} target="_blank" rel="noopener noreferrer">View Video</a>
                                    )}
                                </div>
                                <div className="ar-card-actions">
                                    <button onClick={() => handleEditClick(asset)} className="ar-action-btn--edit">
                                        <FiEdit /> Edit
                                    </button>
                                    <button onClick={() => handleDeleteClick(asset)} className="ar-action-btn--delete">
                                        <FiTrash2 /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {!isLoading && arAssets.length === 0 && (
                    <div className="ar-empty-state">
                        <h3>No AR Assets Found</h3>
                        <p>Click "Add New AR Asset" to get started.</p>
                    </div>
                )}

                {showUploadForm && (
                    <ARUploadModal
                        markers={markers}
                        assetToEdit={assetToEdit}
                        onClose={handleModalClose}
                    />
                )}
            </div>
        </div>
    );
};

export default ArManagement;