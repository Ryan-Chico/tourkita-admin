import React, { useState, useEffect, useCallback } from "react";
import "./ARManagement.css"; // Using the new CSS file
import { FiPlusCircle } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import ARUploadModal from "../components/ARUploadModal";

const ArManagement = () => {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [markers, setMarkers] = useState([]);
    const [arAssets, setArAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Loading state for better UX

    // Fetches markers for the dropdown, ensuring they are up-to-date
    const fetchMarkers = useCallback(async () => {
        try {
            const snapshot = await getDocs(collection(db, "markers"));
            const markersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMarkers(markersData);
        } catch (error) {
            console.error("Error fetching markers:", error);
        }
    }, []);

    // Fetches the created AR assets to display them in the grid
    const fetchArAssets = useCallback(async () => {
        try {
            // It's good practice to order the assets, e.g., by name (the document ID)
            const assetsQuery = query(collection(db, "arTargets"), orderBy("__name__"));
            const snapshot = await getDocs(assetsQuery);
            const assetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setArAssets(assetsData);
        } catch (error) {
            console.error("Error fetching AR assets:", error);
        } finally {
            setIsLoading(false); // Stop loading once data is fetched or fails
        }
    }, []);


    useEffect(() => {
        setIsLoading(true);
        fetchMarkers();
        fetchArAssets();
    }, [fetchMarkers, fetchArAssets]);

    // This handler ensures data is refreshed after an upload
    const handleModalClose = () => {
        setShowUploadForm(false);
        fetchMarkers();
        fetchArAssets();
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
                    <button onClick={() => setShowUploadForm(true)}>
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
                                        onError={(e) => { e.target.style.display = 'none'; }} // Hide broken images
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
                            </div>
                        ))}
                    </div>
                )}
                {/* Message for when there are no assets */}
                {!isLoading && arAssets.length === 0 && (
                    <div className="ar-empty-state">
                        <h3>No AR Assets Found</h3>
                        <p>Click "Add New AR Asset" to get started.</p>
                    </div>
                )}


                {showUploadForm && (
                    <ARUploadModal
                        markers={markers}
                        onClose={handleModalClose}
                    />
                )}
            </div>
        </div>
    );
};

export default ArManagement;
