import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import './MarkersManagement.css';
import { doc, getDocs, getDoc, collection, deleteDoc, setDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import MarkerFormModal from '../components/MarkerFormModal';
import EventFormModal from "../components/EventFormModal";
import EventCalendar from "../components/EventCalendar";
import AdminMapTool from '../components/AdminMapTool';
import { FiEdit, FiTrash2, FiLoader } from 'react-icons/fi'; // Make sure FiLoader is imported

const getEmptyForm = () => ({
    id: '', name: '', image: '', latitude: '', longitude: '', entranceFee: '', address: '',
    description: '', categoryOption: '', arCameraSupported: false, accessibleRestrooms: false,
    openingHours: {
        monday: { open: '', close: '', closed: false }, tuesday: { open: '', close: '', closed: false },
        wednesday: { open: '', close: '', closed: false }, thursday: { open: '', close: '', closed: false },
        friday: { open: '', close: '', closed: false }, saturday: { open: '', close: '', closed: false },
        sunday: { open: '', close: '', closed: false }
    }
});

const MarkersManagement = () => {
    const [markers, setMarkers] = useState([]);
    const [form, setForm] = useState(getEmptyForm());
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [popup, setPopup] = useState({ message: '', status: '' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [eventForm, setEventForm] = useState({
        id: null, title: "", description: "", startDate: "", eventStartTime: "", eventEndTime: "",
        openToPublic: false, locationId: "", customAddress: "", imageUrl: "",
        recurrence: { frequency: "once", daysOfWeek: [], endDate: "" }
    });
    const [editingEvent, setEditingEvent] = useState(null);
    const [loadingMarkers, setLoadingMarkers] = useState(true);
    const [activeTab, setActiveTab] = useState('markers');
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [deletingId, setDeletingId] = useState(null); // State for the loading spinner

    const fetchMarkers = useCallback(async () => {
        setLoadingMarkers(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'markers'));
            const markersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMarkers(markersData);
        } catch (error) {
            console.error("Error fetching markers:", error);
        } finally {
            setLoadingMarkers(false);
        }
    }, []);

    // Note: This function was duplicated in your original code; I've removed the redundant one.
    useEffect(() => {
        fetchMarkers();
    }, [fetchMarkers]);

    const fetchEvents = useCallback(async () => {
        // Fetch events logic here...
    }, []);

    useEffect(() => {
        if (activeTab === 'events') {
            fetchEvents();
        }
    }, [activeTab, fetchEvents]);


    const handleSubmit = async () => {
        // Your existing handleSubmit logic...
        const { name, latitude, longitude, address, description } = form;
        if (!name || !latitude || !longitude || !address || !description) {
            setPopup({ message: 'Please fill in all required fields.', status: 'error' });
            return;
        }
        setLoading(true);
        try {
            const finalCategory = form.categoryOption === 'Other' ? form.customCategory : form.categoryOption;
            const markerId = editingId || String(Date.now());
            const newMarkerData = { ...form, id: markerId, category: finalCategory };
            await setDoc(doc(db, "markers", markerId), newMarkerData);
            await fetchMarkers();
            setPopup({ message: isEditing ? 'Marker updated successfully!' : 'Marker added successfully!', status: 'success' });
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving marker:', error);
            setPopup({ message: 'Error occurred. Please try again.', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (marker) => {
        const isCustom = !['Historical', 'Restaurant', 'Park', 'Museum'].includes(marker.category);
        setForm({
            ...marker,
            categoryOption: isCustom ? 'Other' : marker.category,
            customCategory: isCustom ? marker.category : '',
        });
        setEditingId(marker.id);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleDelete = async (marker) => {
        if (!window.confirm(`Are you sure you want to delete "${marker.name}" and all associated data?`)) return;

        setDeletingId(marker.id); // Show spinner on this card
        try {
            // If marker has AR, delete associated AR data first
            if (marker.arCameraSupported) {
                const arTargetRef = doc(db, 'arTargets', marker.name);
                const arTargetSnap = await getDoc(arTargetRef);
                if (arTargetSnap.exists()) {
                    const arData = arTargetSnap.data();
                    const arFilesToDelete = [arData.imageUrl, arData.modelUrl, arData.videoUrl].filter(Boolean);
                    if (arFilesToDelete.length > 0) {
                        await Promise.all(arFilesToDelete.map(url => deleteObject(ref(storage, url))));
                    }
                }
                await deleteDoc(arTargetRef);
                await deleteDoc(doc(db, 'arMarkers', marker.name));
            }

            // Delete the main marker image from storage
            if (marker.image) {
                await deleteObject(ref(storage, marker.image));
            }

            // Finally, delete the marker document from Firestore
            await deleteDoc(doc(db, 'markers', marker.id));

            setMarkers(prev => prev.filter(m => m.id !== marker.id));
            setPopup({ message: 'Marker deleted successfully!', status: 'success' });
        } catch (error) {
            console.error('Error deleting marker:', error);
            setPopup({ message: 'Error deleting the marker.', status: 'error' });
        } finally {
            setDeletingId(null); // Hide spinner
        }
    };

    const filteredMarkers = markers.filter(marker =>
        marker.name.toLowerCase().includes(search.toLowerCase()) ||
        marker.category?.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddMarkerClick = () => {
        setForm(getEmptyForm());
        setEditingId(null);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const SkeletonMarkerCard = () => (
        <div className="marker-card skeleton-card">
            <div className="skeleton skeleton-image"></div>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-line short"></div>
            <div className="skeleton skeleton-line medium"></div>
        </div>
    );

    const SkeletonMarkerList = ({ count = 6 }) => (
        <>{Array.from({ length: count }).map((_, i) => <SkeletonMarkerCard key={i} />)}</>
    );

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <h2>Markers Management</h2>
                <div className="mtab-buttons">
                    <button className={`mtab ${activeTab === 'markers' ? 'active' : ''}`} onClick={() => setActiveTab('markers')}>Manage Markers</button>
                    <button className={`mtab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Manage Events</button>
                </div>

                {popup.message && <div className={`popup-message ${popup.status}`}>{popup.message}</div>}

                {activeTab === 'markers' && (
                    <>
                        <div className="top-controls">
                            <input type="text" placeholder="Search markers or category..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            <button onClick={handleAddMarkerClick}>Add New Marker</button>
                        </div>

                        <div className="markers-list">
                            {loadingMarkers ? <SkeletonMarkerList count={10} /> : (
                                filteredMarkers.map(marker => (
                                    <div key={marker.id} className="marker-card">
                                        {deletingId === marker.id && (
                                            <div className="card-loading-overlay">
                                                <FiLoader className="spinner" />
                                            </div>
                                        )}
                                        <img src={marker.image} alt={marker.name} onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300x160?text=No+Image'; }} />
                                        <h4>{marker.name}</h4>
                                        <p>{marker.category}</p>
                                        <div className="card-actions">
                                            <button onClick={() => handleEdit(marker)} className="edit-btn" disabled={deletingId === marker.id}>Edit</button>
                                            <button onClick={() => handleDelete(marker)} className="delete-btn" disabled={deletingId === marker.id}>Delete</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {activeTab === "events" && (
                    <>
                        {/* Your Event Management UI */}
                    </>
                )}

                {isModalOpen && (
                    <MarkerFormModal
                        form={form}
                        setForm={setForm}
                        onSubmit={handleSubmit}
                        onCancel={() => setIsModalOpen(false)}
                        loading={loading}
                        isEditing={isEditing}
                    />
                )}
                <AdminMapTool />
            </main>
        </div>
    );
};

export default MarkersManagement;