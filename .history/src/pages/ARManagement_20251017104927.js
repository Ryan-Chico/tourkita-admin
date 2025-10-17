import React, { useState, useEffect, useCallback } from "react";
import "./ARManagement.css";
import "@google/model-viewer"; // ✨ Import the model viewer library
import { FiEdit, FiTrash2, FiPlusCircle, FiEye } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import ARUploadModal from "../components/ARUploadModal";
import ARPreviewModal from "../components/ARPreviewModal";

const ArManagement = () => {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [assetToEdit, setAssetToEdit] = useState(null);
    const [assetToPreview, setAssetToPreview] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [arAssets, setArAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // ... (All your functions like fetchMarkers, fetchArAssets, etc. remain exactly the same)
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

    const handlePreviewClick = (asset) => {
        setAssetToPreview(asset);
        setShowPreviewModal(true);
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
                <div className="page-header">
                    <h2 className="page-title">AR Asset Management</h2>
                    <p className="page-subtitle">Manage 3D models and content for locations in Intramuros.</p>
                </div>

                <div className="top-controls">
                    <button onClick={() => { setAssetToEdit(null); setShowUploadForm(true); }}>
                        <FiPlusCircle />
                        Add New AR Asset
                    </button>
                </div>

                {isLoading ? (
                    <p>Loading assets...</p>
                ) : (
                    <div className="markers-list">
                        {arAssets.map((asset) => (
                            <div className="marker-card" key={asset.id}>
                                <div className="marker-card-image">
                                    {/* --- ✨ REPLACEMENT LOGIC --- */}
                                    {asset.modelUrl ? (
                                        <model-viewer
                                            src={asset.modelUrl}
                                            alt={`3D model for ${asset.id}`}
                                            auto-rotate
                                            camera-controls
                                            disable-zoom
                                            style={{ width: '100%', height: '160px', backgroundColor: '#f0f0f0' }}
                                        ></model-viewer>
                                    ) : (
                                        <img
                                            src={asset.imageUrl}
                                            alt={asset.id}
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300x160?text=No+Image'; }}
                                        />
                                    )}
                                    {/* --- END OF REPLACEMENT --- */}
                                </div>
                                <div className="marker-card-content">
                                    <h4>{asset.id}</h4>
                                    <p>Physical Width: {asset.physicalWidth}m</p>
                                </div>
                                <div className="card-actions">
                                    <button onClick={() => handlePreviewClick(asset)} className="view-btn" title="View Asset">
                                        <FiEye />
                                    </button>
                                    <button onClick={() => handleEditClick(asset)} className="edit-btn" title="Edit Asset">
                                        <FiEdit />
                                    </button>
                                    <button onClick={() => handleDeleteClick(asset)} className="delete-btn" title="Delete Asset">
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && arAssets.length === 0 && (
                    <div className="empty-state">
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

                {showPreviewModal && (
                    <ARPreviewModal
                        asset={assetToPreview}
                        onClose={() => setShowPreviewModal(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default ArManagement;