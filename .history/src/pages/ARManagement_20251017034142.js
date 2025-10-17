import React, { useState, useEffect, useCallback } from "react";
import "./ARManagement.css";
import { FiEdit, FiTrash2, FiPlusCircle, FiExternalLink } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import ARUploadModal from "../components/ARUploadModal";

const ArManagement = () => {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [assetToEdit, setAssetToEdit] = useState(null);
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

    const handleModalClose = () => {
        setShowUploadForm(false);
        setAssetToEdit(null);
        fetchArAssets();
    };

    const handleEditClick = (asset) => {
        setAssetToEdit(asset);
        setShowUploadForm(true);
    };

    const handleDeleteClick = async (asset) => {
        if (!window.confirm(`Are you sure you want to delete the AR asset for "${asset.id}"? This action cannot be undone.`)) {
            return;
        }
        setIsLoading(true);
        try {
            const fileUrls = [asset.imageUrl, asset.modelUrl, asset.videoUrl].filter(Boolean);
            const deletePromises = fileUrls.map(url => deleteObject(ref(storage, url)));
            await Promise.all(deletePromises);
            await deleteDoc(doc(db, "arTargets", asset.id));

            const markerToUpdate = markers.find(m => m.name === asset.id);
            if (markerToUpdate) {
                const markerRef = doc(db, "markers", markerToUpdate.id);
                await updateDoc(markerRef, {
                    arCameraSupported: false,
                    modelUrl: ""
                });
            }
            alert("AR Asset deleted successfully!");
            fetchArAssets();
            fetchMarkers();
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
                        <FiPlusCircle />
                        Add New AR Asset
                    </button>
                </div>
//... inside your ArManagement component's return statement

                {isLoading ? (
                    <p>Loading assets...</p>
                ) : (
                    <div className="ar-grid"> {/* This outer grid class remains the same */}
                        {arAssets.map((asset) => (
                            // START of changes: Use this new card structure
                            <div className="marker-card" key={asset.id}>
                                <div className="marker-card-image">
                                    <img
                                        src={asset.imageUrl}
                                        alt={asset.id}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                </div>
                                <div className="marker-card-content">
                                    <h3>{asset.id}</h3>
                                    <p>Width: {asset.physicalWidth}m</p>
                                </div>
                                <div className="marker-card-actions">
                                    <button onClick={() => handleEditClick(asset)} className="edit-btn">
                                        <FiEdit /> Edit
                                    </button>
                                    <button onClick={() => handleDeleteClick(asset)} className="delete-btn">
                                        <FiTrash2 /> Delete
                                    </button>
                                </div>
                            </div>
                            // END of changes
                        ))}
                    </div>
                )}

// ... rest of the file stays the same
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