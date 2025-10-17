import React, { useState, useEffect } from "react";
import "./ARManagement.css";
import { FiBox, FiPlusCircle } from "react-icons/fi";
import Sidebar from "../components/Sidebar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import ARUploadModal from "../components/ARUploadModal";

const ArManagement = () => {
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [markers, setMarkers] = useState([]);

    useEffect(() => {
        const fetchMarkers = async () => {
            const snapshot = await getDocs(collection(db, "markers"));
            setMarkers(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        };
        fetchMarkers();
    }, []);

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

                {!showUploadForm && (
                    <div className="ar-grid">
                        {[...Array(6)].map((_, idx) => (
                            <div className="ar-card" key={idx}>
                                <div className="ar-icon"><FiBox size={48} /></div>
                                <h3>AR Content #{idx + 1}</h3>
                                <p>Preview or description placeholder</p>
                            </div>
                        ))}
                    </div>
                )}

                {showUploadForm && (
                    <ARUploadModal
                        markers={markers}
                        onClose={() => setShowUploadForm(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default ArManagement;
