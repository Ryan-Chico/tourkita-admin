import React, { useState, useEffect } from "react";
import {
    collection,
    getDocs,
    query,
    orderBy,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import Sidebar from "../components/Sidebar";
import "./FeedbackReview.css";
import FeedbackTable from "../components/FeedbackTable";
import Drilldown from "../components/Drilldown";

const FeedbackReview = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("Location Feedback");
    const [feedbackList, setFeedbackList] = useState([]);

    const [averageRating, setAverageRating] = useState("N/A");
    const [mostLovedLocation, setMostLovedLocation] = useState("N/A");
    const [areaOfConcern, setAreaOfConcern] = useState("N/A");
    const [mostLovedFeature, setMostLovedFeature] = useState("N/A");
    const [areaOfConcernFeature, setAreaOfConcernFeature] = useState("N/A");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserEmail, setSelectedUserEmail] = useState("");
    const [selectedFeatureOrLocation, setSelectedFeatureOrLocation] = useState("");
    const [messageText, setMessageText] = useState("");
    const [isSending, setIsSending] = useState(false);

    const [imagePreview, setImagePreview] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [displayCount, setDisplayCount] = useState(5);
    const maxDisplay = 20;
    const [isExpanded, setIsExpanded] = useState(false);

    const [overallTop, setOverallTop] = useState("N/A");
    const [overallLow, setOverallLow] = useState("N/A");
    const [overallLocationRating, setOverallLocationRating] = useState("N/A");
    const [overallFeatureRating, setOverallFeatureRating] = useState("N/A");

    const isFeatureTab = activeTab === "Feature Feedback";
    const isAllTab = activeTab === "All Feedback";
    const isLocationTab = activeTab === "Location Feedback";

    const asDate = (tsOrDate) => {
        if (!tsOrDate) return null;
        if (tsOrDate.toDate) return tsOrDate.toDate();
        if (tsOrDate instanceof Date) return tsOrDate;
        return new Date(tsOrDate);
    };

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const q = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                setFeedbackList(data);
                calculateStats(data, activeTab);
            } catch (err) {
                console.error("fetchFeedback error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeedback();
    }, []);

    useEffect(() => {
        calculateStats(feedbackList, activeTab);
    }, [activeTab, feedbackList]);

    const calculateStats = (data, tabType) => {
        let filtered;
        if (tabType === "Feature Feedback") {
            filtered = data.filter((i) => i.feedbackType === "App Feedback");
            const featureStats = avgPerKey(filtered);
            if (featureStats.length) {
                setMostLovedFeature(featureStats[0].key);
                setAreaOfConcernFeature(featureStats[featureStats.length - 1].key);
            } else {
                setMostLovedFeature("N/A");
                setAreaOfConcernFeature("N/A");
            }
        } else if (tabType === "Location Feedback") {
            filtered = data.filter((i) => i.feedbackType === "Location Feedback");
            const locationStats = avgPerKey(filtered);
            if (locationStats.length) {
                setMostLovedLocation(locationStats[0].key);
                setAreaOfConcern(locationStats[locationStats.length - 1].key);
            } else {
                setMostLovedLocation("N/A");
                setAreaOfConcern("N/A");
            }
        } else {
            filtered = data;
            setMostLovedFeature("N/A");
            setAreaOfConcernFeature("N/A");
            setMostLovedLocation("N/A");
            setAreaOfConcern("N/A");
        }

        const avg = filtered.reduce((acc, cur) => acc + (cur.rating || 0), 0) / filtered.length;
        setAverageRating(isNaN(avg) ? "N/A" : avg.toFixed(1));

        const locationRatings = data.filter(i => i.feedbackType === "Location Feedback").map(i => i.rating || 0);
        const featureRatings = data.filter(i => i.feedbackType === "App Feedback").map(i => i.rating || 0);

        setOverallLocationRating(locationRatings.length
            ? (locationRatings.reduce((a, b) => a + b, 0) / locationRatings.length).toFixed(1)
            : "N/A");

        setOverallFeatureRating(featureRatings.length
            ? (featureRatings.reduce((a, b) => a + b, 0) / featureRatings.length).toFixed(1)
            : "N/A");

        const globalRatings = {};
        data.forEach((item) => {
            const key = item.feature || item.location;
            if (key) {
                if (!globalRatings[key]) globalRatings[key] = [];
                globalRatings[key].push(item.rating || 0);
            }
        });

        const globalAverages = Object.entries(globalRatings).map(([key, ratings]) => ({
            key,
            avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        }));

        if (globalAverages.length) {
            globalAverages.sort((a, b) => b.avg - a.avg);
            setOverallTop(globalAverages[0].key);
            setOverallLow(globalAverages[globalAverages.length - 1].key);
        } else {
            setOverallTop("N/A");
            setOverallLow("N/A");
        }
    };

    const avgPerKey = (items) => {
        const map = {};
        items.forEach((it) => {
            let key;
            if (isFeatureTab) key = it.feature || "N/A";
            else if (isLocationTab) key = it.location || "N/A";
            else key = it.feature || it.location || "N/A";
            if (!map[key]) map[key] = [];
            if (it.rating) map[key].push(it.rating);
        });

        const arr = Object.entries(map).map(([key, ratings]) => ({
            key,
            avg: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
            count: ratings.length,
        }));

        arr.sort((a, b) => b.avg - a.avg);
        return arr;
    };

    const filteredFeedback = feedbackList.filter(
        (item) =>
            (isAllTab ||
                (isFeatureTab && item.feedbackType === "App Feedback") ||
                (isLocationTab && item.feedbackType === "Location Feedback")) &&
            (item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.location || item.feature)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.createdAt?.toDate?.().toLocaleString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.rating?.toString().includes(searchTerm))
    );

    const displayedFeedback = filteredFeedback.slice(0, displayCount);

    const handleShowMore = () => {
        setDisplayCount(Math.min(filteredFeedback.length, maxDisplay));
        setIsExpanded(true);
    };
    useEffect(() => {
        setDisplayCount(5);
    }, [activeTab, searchTerm]);
    const handleShowLess = () => {
        setDisplayCount(5);
        setIsExpanded(false);
    };

    const renderStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);
    const formatTimestamp = (timestamp) => (timestamp?.toDate ? timestamp.toDate().toLocaleString() : "N/A");

    const sendMessage = async () => {
        if (!messageText.trim()) return alert("Message cannot be empty.");
        setIsSending(true);
        try {
            await addDoc(collection(db, "adminMessages"), {
                to: selectedUserEmail,
                message: messageText,
                context: selectedFeatureOrLocation,
                contextType: isFeatureTab ? "Feature" : "Location",
                sentAt: serverTimestamp(),
            });
            alert("Message sent successfully!");
            setIsModalOpen(false);
            setMessageText("");
        } catch (err) {
            console.error("Failed to send message:", err);
            alert("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="dashboard-main">
                <div className="dashboard-header">
                    <h2>Feedback Overview</h2>
                </div>

                <div className="cards-container">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="card brown">
                                {/* Mimic Dashboard skeletons */}
                                <div className="skeleton skeleton-title" style={{ width: '60%', height: '20px', marginBottom: '8px', borderRadius: '6px' }}></div>
                                <div className="skeleton skeleton-line short" style={{ width: '80%', height: '14px', borderRadius: '4px' }}></div>
                            </div>
                        ))
                        : (
                            <>
                                {isLocationTab && (
                                    <>
                                        <div className="card brown">
                                            <p>Average Location Rating</p>
                                            <h2>{overallLocationRating}</h2>
                                        </div>
                                        <div className="card brown">
                                            <p>Most Loved Location</p>
                                            <h2>{mostLovedLocation || "N/A"}</h2>
                                        </div>
                                        <div className="card brown">
                                            <p>Area of Concern (Location)</p>
                                            <h2>{areaOfConcern || "N/A"}</h2>
                                        </div>
                                    </>
                                )}

                                {isFeatureTab && (
                                    <>
                                        <div className="card brown">
                                            <p>Average Feature Rating</p>
                                            <h2>{overallFeatureRating}</h2>
                                        </div>
                                        <div className="card brown">
                                            <p>Most Loved Feature</p>
                                            <h2>{mostLovedFeature || "N/A"}</h2>
                                        </div>
                                        <div className="card brown">
                                            <p>Area of Concern (Feature)</p>
                                            <h2>{areaOfConcernFeature || "N/A"}</h2>
                                        </div>
                                    </>
                                )}

                                {isAllTab && (
                                    <>
                                        <div className="card brown">
                                            <p>Overall Average Rating</p>
                                            <h2>{averageRating}</h2>
                                        </div>
                                        <div className="card brown">
                                            <p>Overall Most Loved</p>
                                            <h2>{overallTop || "N/A"}</h2>
                                        </div>
                                        <div className="card brown">
                                            <p>Overall Area of Concern</p>
                                            <h2>{overallLow || "N/A"}</h2>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                </div>



                <div className="mtab-buttons">
                    <button
                        className={`mtab ${activeTab === "Location Feedback" ? "active" : ""}`}
                        onClick={() => { setActiveTab("Location Feedback"); setSearchTerm(""); }}
                    >
                        Location Feedback
                    </button>
                    <button
                        className={`mtab ${activeTab === "Feature Feedback" ? "active" : ""}`}
                        onClick={() => { setActiveTab("Feature Feedback"); setSearchTerm(""); }}
                    >
                        Feature Feedback
                    </button>
                    <button
                        className={`mtab ${activeTab === "All Feedback" ? "active" : ""}`}
                        onClick={() => { setActiveTab("All Feedback"); setSearchTerm(""); }}
                    >
                        All Feedback
                    </button>
                </div>

                <div className="main-content">


                    <FeedbackTable
                        loading={loading}
                        feedback={displayedFeedback}
                        isAllTab={isAllTab}
                        isFeatureTab={isFeatureTab}
                        renderStars={renderStars}
                        formatTimestamp={formatTimestamp}
                        onImageClick={(url) => {
                            setImagePreview(url);
                            setShowImageModal(true);
                        }}
                        onSendMessage={(email, context) => {
                            setSelectedUserEmail(email);
                            setSelectedFeatureOrLocation(context || "N/A");
                            setIsModalOpen(true);
                        }}
                    />

                    <div style={{ textAlign: "center", marginTop: "20px" }}>
                        {!isExpanded && filteredFeedback.length > displayCount && (
                            <button className="show-more-btn" onClick={handleShowMore}>
                                Show More
                            </button>
                        )}
                        {isExpanded && (
                            <button className="show-less-btn" onClick={handleShowLess}>
                                Show Less
                            </button>
                        )}
                    </div>

                    {showImageModal && (
                        <div className="modal-overlay" onClick={() => setShowImageModal(false)}>
                            <div className="modal-content">
                                <img src={imagePreview} alt="Preview" className="preview-image" />
                            </div>
                        </div>
                    )}

                    {isModalOpen && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h3>
                                    Send Message to <span className="modal-email">{selectedUserEmail}</span>
                                </h3>
                                <p className="modal-sub">
                                    Regarding: <strong>{isFeatureTab ? "Feature" : "Location"} - {selectedFeatureOrLocation}</strong>
                                </p>
                                <textarea
                                    className="modal-textarea"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Type your message here..."
                                    rows={5}
                                />
                                <div className="modal-actions">
                                    <button className="send-btn" onClick={sendMessage} disabled={isSending}>
                                        {isSending ? "Sending..." : "Send"}
                                    </button>
                                    <button className="cancel-btn" onClick={() => setIsModalOpen(false)} disabled={isSending}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <Drilldown
                        feedbackList={feedbackList}
                        activeTab={activeTab}
                    />
                </div>
            </div>
        </div>
    );
};

export default FeedbackReview;
