import React, { useState, useEffect, useCallback } from "react"; // ✨ Import useCallback
import "./ARManagement.css";
import { FiBox, FiPlusCircle } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import ARUploadModal from "../components/ARUploadModal";

const ArManagement = () => {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [markers, setMarkers] = useState([]);
    // ✨ NEW: State to hold the AR assets you want to display
    const [arAssets, setArAssets] = useState([]);

    // ✨ FIX: Created a reusable function to fetch markers
    // useCallback prevents this function from being recreated on every render
    const fetchMarkers = useCallback(async () => {
        try {
            const snapshot = await getDocs(collection(db, "markers"));
            // ✨ FIX: Now fetching the ENTIRE document data, including arCameraSupported
            const markersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMarkers(markersData);
        } catch (error) {
            console.error("Error fetching markers:", error);
        }
    }, []);

    // ✨ NEW: Function to fetch the AR assets for display
    const fetchArAssets = useCallback(async () => {
        try {
            const snapshot = await getDocs(collection(db, "arTargets"));
            const assetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setArAssets(assetsData);
        } catch (error) {
            console.error("Error fetching AR assets:", error);
        }
    }, []);


    useEffect(() => {
        // Fetch both markers and assets when the component first loads
        fetchMarkers();
        fetchArAssets();
    }, [fetchMarkers, fetchArAssets]); // Add dependencies

    // ✨ FIX: This handler now closes the modal AND refreshes all data
    const handleModalClose = () => {
        setShowUploadForm(false);
        fetchMarkers(); // Re-fetch markers to update the dropdown list
        fetchArAssets(); // Re-fetch assets to update the grid display
    };

    return (
        <div className="dashboard-main">
            <Sidebar />
            <div className="dashboard-section">
                <div className="ar-header">
                    <h2>AR Asset Management</h2>
                </div>

                <div className="ar-top-controls">
                    <button onClick={() => setShowUploadForm(true)}>
                        <FiPlusCircle style={{ marginRight: "6px" }} />
                        Add New AR Assets
                    </button>
                </div>

                {/* ✨ NEW: This grid now displays your actual AR data */}
                <div className="ar-grid">
                    {arAssets.length > 0 ? (
                        arAssets.map((asset) => (
                            <div className="ar-card" key={asset.id}>
                                <div className="ar-card-image">
                                    {/* Use the imageUrl as a background for a preview */}
                                    <img src={asset.imageUrl} alt={asset.id} />
                                </div>
                                <h3>{asset.id}</h3> {/* The name of the location */}
                                <a href={asset.modelUrl} target="_blank" rel="noopener noreferrer">
                                    View 3D Model
                                </a>
                            </div>
                        ))
                    ) : (
                        // Optional: Show a message if no assets are found
                        <p>No AR assets found. Add one to get started!</p>
                    )}
                </div>

                {showUploadForm && (
                    <ARUploadModal
                        markers={markers}
                        onClose={handleModalClose} // Use the new handler
                    />
                )}
            </div>
        </div>
    );
};

export default ArManagement;