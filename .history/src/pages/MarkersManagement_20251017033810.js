import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './MarkersManagement.css';
import { doc, addDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import MarkerFormModal from '../components/MarkerFormModal';
import EventFormModal from "../components/EventFormModal";
import EventCalendar from "../components/EventCalendar";
import AdminMapTool from '../components/AdminMapTool';

const getEmptyForm = () => ({
    id: '',
    name: '',
    image: '',
    latitude: '',
    longitude: '',
    entranceFee: '',
    address: '',
    description: '',
    categoryOption: '',
    arCameraSupported: false,
    accessibleRestrooms: false,
    openingHours: {
        monday: { open: '', close: '', closed: false },
        tuesday: { open: '', close: '', closed: false },
        wednesday: { open: '', close: '', closed: false },
        thursday: { open: '', close: '', closed: false },
        friday: { open: '', close: '', closed: false },
        saturday: { open: '', close: '', closed: false },
        sunday: { open: '', close: '', closed: false },
    },
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
    const [activeTab, setActiveTab] = useState('markers');

    // Fetch all markers
    const fetchMarkers = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'markers'));
            const markersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMarkers(markersData);
        } catch (error) {
            console.error('Error fetching markers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarkers();
    }, []);

    const handleSubmit = async () => {
        const { name, latitude, longitude, address, description, entranceFee } = form;

        if (!name || !latitude || !longitude || !address || !description) {
            setPopup({ message: 'Please fill in all required fields.', status: 'error' });
            return;
        }

        if (isNaN(latitude) || isNaN(longitude)) {
            setPopup({ message: 'Latitude and Longitude must be valid numbers.', status: 'error' });
            return;
        }

        if (entranceFee && isNaN(entranceFee)) {
            setPopup({ message: 'Entrance Fee must be a valid number.', status: 'error' });
            return;
        }

        setLoading(true);
        try {
            const finalCategory = form.categoryOption === 'Other' ? form.customCategory : form.categoryOption;
            const markerData = {
                ...form,
                id: editingId || Date.now(),
                category: finalCategory,
            };

            const docRef = doc(db, 'markers', String(markerData.id));
            await setDoc(docRef, markerData);

            setPopup({ message: isEditing ? 'Marker updated successfully!' : 'Marker added successfully!', status: 'success' });
            setForm(getEmptyForm());
            setIsModalOpen(false);
            setIsEditing(false);
            setEditingId(null);
            fetchMarkers();
        } catch (error) {
            console.error('Error saving marker:', error);
            setPopup({ message: 'Error occurred while saving.', status: 'error' });
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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this marker?')) return;
        setLoading(true);
        try {
            await deleteDoc(doc(db, 'markers', String(id)));
            setPopup({ message: 'Marker deleted successfully!', status: 'success' });
            setMarkers(prev => prev.filter(marker => marker.id !== id));
        } catch (error) {
            console.error('Error deleting marker:', error);
            setPopup({ message: 'Error deleting marker.', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddMarkerClick = () => {
        setForm(getEmptyForm());
        setEditingId(null);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const filteredMarkers = markers
        .filter(marker => marker.arCameraSupported === true) // ✅ Only show AR-supported markers
        .filter(marker =>
            marker.name.toLowerCase().includes(search.toLowerCase()) ||
            marker.category?.toLowerCase().includes(search.toLowerCase())
        );

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <div className="ar-header">
                    <h2 className="ar-title">AR Markers</h2>
                    <p className="ar-subtitle">Only landmarks with AR Camera Support</p>
                </div>

                <div className="ar-top-controls">
                    <input
                        type="text"
                        placeholder="Search AR markers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button onClick={handleAddMarkerClick}>+ Add AR Marker</button>
                </div>

                {popup.message && (
                    <div className={`popup-message ${popup.status}`}>
                        {popup.message}
                    </div>
                )}

                <div className="asset-grid">
                    {loading ? (
                        <p>Loading markers...</p>
                    ) : filteredMarkers.length === 0 ? (
                        <div className="ar-empty-state">
                            <h3>No AR-supported markers found.</h3>
                            <p>Add a new one using the button above.</p>
                        </div>
                    ) : (
                        filteredMarkers.map(marker => (
                            <div key={marker.id} className="asset-card">
                                <div className="asset-card-image-container">
                                    <img src={marker.image} alt={marker.name} className="asset-card-image" />
                                </div>
                                <div className="asset-card-content">
                                    <h3 className="asset-card-title">{marker.name}</h3>
                                    <p className="asset-card-meta">{marker.category || 'Uncategorized'}</p>
                                    <p>{marker.description?.slice(0, 100)}...</p>
                                </div>
                                <div className="asset-card-actions">
                                    <button className="asset-action-btn edit-btn" onClick={() => handleEdit(marker)}>
                                        ✏️ Edit
                                    </button>
                                    <button className="asset-action-btn delete-btn" onClick={() => handleDelete(marker.id)}>
                                        🗑 Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

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
