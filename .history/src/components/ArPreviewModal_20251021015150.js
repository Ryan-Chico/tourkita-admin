import React from "react";
import "@google/model-viewer";
import "./ARPreviewModal.css";
import { FiX } from "react-icons/fi";

const ARPreviewModal = ({ asset, onClose }) => {
    if (!asset) return null;

    return (
        <div className="preview-modal-overlay" onClick={onClose}>
            <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="preview-modal-close-btn" onClick={onClose}>
                    <FiX />
                </button>
                <h2>{asset.name || asset.id}</h2>

                {/* --- NEW: Details Section --- */}
                <div className="preview-details">
                    <p><strong>Category:</strong> {asset.category || 'N/A'}</p>
                    <p><strong>Location:</strong> {asset.locationName || 'N/A'}</p>
                    <p><strong>Description:</strong> {asset.description || 'No description provided.'}</p>
                </div>

                <div className="preview-grid">
                    {/* Section 1: Target Image */}
                    {asset.imageUrl && (
                        <div className="preview-item">
                            <h3>Target Image</h3>
                            {/* --- UPDATED: Alt text --- */}
                            <img src={asset.imageUrl} alt={`${asset.name} target`} className="preview-image" />
                        </div>
                    )}

                    {/* Section 2: 3D Model */}
                    {asset.modelUrl && (
                        <div className="preview-item">
                            <h3>3D Model</h3>
                            <model-viewer
                                src={asset.modelUrl}
                                /* --- UPDATED: Alt text --- */
                                alt={`3D model for ${asset.name}`}
                                ar
                                camera-controls
                                auto-rotate
                                shadow-intensity="1"
                                style={{ width: '100%', height: '300px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}
                            ></model-viewer>
                        </div>
                    )}

                    {/* Section 3: Video */}
                    {asset.videoUrl && (
                        <div className="preview-item">
                            <h3>Video</h3>
                            <video src={asset.videoUrl} controls className="preview-video">
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ARPreviewModal;