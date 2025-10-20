import React, { useState, useEffect, useCallback, useMemo } from "react"; // Import useMemo
import "./ARManagement.css";
import "@google/model-viewer";
import { FiLoader } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import ARUploadModal from "../components/ARUploadModal";
import ARPreviewModal from "../components/ARPreviewModal";

// --- Skeleton components remain the same ---
const SkeletonARCard = () => (
    <div className="marker-card skeleton-card">
        <div className="skeleton skeleton-image"></div>
        <div className="marker-card-content">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text"></div>
        </div>
        <div className="card-actions">
            <div className="skeleton skeleton-button"></div>
            <div className="skeleton skeleton-button"></div>
        </div>
    </div>
);

const SkeletonARList = ({ count = 8 }) => (
    <>
        {Array.from({ length: count }).map((_, index) => (
            <SkeletonARCard key={index} />
        ))}
    </>
);

const ArManagement = () => {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [assetToEdit, setAssetToEdit] = useState(null);
    const [assetToPreview, setAssetToPreview] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [arAssets, setArAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    // --- NEW: State for category filtering ---
    const [activeCategory, setActiveCategory] = useState("All");

    const fetchMarkers = useCallback(async () => {
        try {
            const snapshot = await getDocs(collection(db, "markers"));
            const markersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMarkers(markersData);
        } catch (error) { console.error("Error fetching markers:", error); }
    }, []);

    const fetchArAssets = useCallback(async () => {
        try {
            const assetsQuery = query(collection(db, "arTargets"), orderBy("__name__"));
            const snapshot = await getDocs(assetsQuery);
            const assetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setArAssets(assetsData);
        } catch (error) { console.error("Error fetching AR assets:", error); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => {
        setIsLoading(true);
        fetchMarkers();
        fetchArAssets();
    }, [fetchMarkers, fetchArAssets]);

    // --- NEW: Memoized filtered list of assets ---
    const filteredAssets = useMemo(() => {
        if (activeCategory === "All") {
            return arAssets;
        }
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

    const handleDeleteClick = async (e, asset) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete all AR data for "${asset.name || asset.id}"? This action cannot be undone.`)) {
            return;
        }
        setDeletingId(asset.id);
        try {
            const markerToUpdate = markers.find(m => m.name === asset.id);
            if (markerToUpdate) {
                const markerRef = doc(db, "markers", String(markerToUpdate.id));
                await updateDoc(markerRef, {
                    arCameraSupported: false,
                    modelUrl: ""
                });
            }
            await deleteDoc(doc(db, "arTargets", asset.id));
            await deleteDoc(doc(db, "arMarkers", asset.id));

            const filesToDelete = [asset.imageUrl, asset.modelUrl, asset.videoUrl].filter(Boolean);
            if (filesToDelete.length > 0) {
                const deletePromises = filesToDelete.map(url => deleteObject(ref(storage, url)));
                await Promise.all(deletePromises);
            }
            alert("AR Asset and all associated data deleted successfully!");
            fetchArAssets();
            fetchMarkers();
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
                    {/* --- NEW: Category Filter Buttons --- */}
                    <div className="category-filters">
                        <button onClick={() => setActiveCategory("All")} className={activeCategory === 'All' ? 'active' : ''}>All</button>
                        <button onClick={() => setActiveCategory("Building")} className={activeCategory === 'Building' ? 'active' : ''}>Buildings</button>
                        <button onClick={() => setActiveCategory("Relics/Artifacts")} className={activeCategory === 'Relics/Artifacts' ? 'active' : ''}>Relics/Artifacts</button>
                    </div>
                    <button onClick={() => { setAssetToEdit(null); setShowUploadForm(true); }}>Add New AR Asset</button>
                </div>
                <div className="markers-list">
                    {isLoading ? (
                        <SkeletonARList count={8} />
                    ) : (
                        // --- UPDATED: Map over the filtered list ---
                        filteredAssets.map((asset) => (
                            <div className="marker-card" key={asset.id} onClick={() => deletingId !== asset.id && handlePreviewClick(asset)}>
                                {deletingId === asset.id && (
                                    <div className="card-loading-overlay">
                                        <FiLoader className="spinner" />
                                    </div>
                                )}
                                <div className="marker-card-image">
                                    {asset.modelUrl ? (
                                        <model-viewer src={asset.modelUrl} alt={`3D model for ${asset.name}`} auto-rotate camera-controls disable-zoom style={{ width: '100%', height: '160px', backgroundColor: '#f0f0f0' }}></model-viewer>
                                    ) : (
                                        <img src={asset.imageUrl} alt={asset.name} onError={(el) => { el.target.onerror = null; el.target.src = 'https://via.placeholder.com/300x160?text=No+Image'; }} />
                                    )}
                                </div>
                                {/* --- UPDATED: Display name and description --- */}
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
                        ))
                    )}
                </div>

                {/* --- UPDATED: Show empty state for the filtered list --- */}
                {!isLoading && filteredAssets.length === 0 && (
                    <div className="empty-state">
                        <h3>No AR Assets Found for '{activeCategory}'</h3>
                        <p>Click "Add New AR Asset" to get started or select a different category.</p>
                    </div>
                )}

                {showUploadForm && <ARUploadModal markers={markers} assetToEdit={assetToEdit} onClose={handleModalClose} />}
                {showPreviewModal && <ARPreviewModal asset={assetToPreview} onClose={() => setShowPreviewModal(false)} />}
            </div>
        </div>
    );
};

export default ArManagement;