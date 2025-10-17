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
        id: null,
        title: "",
        description: "",
        startDate: "",
        eventStartTime: "",
        eventEndTime: "",
        openToPublic: false,
        locationId: "",
        customAddress: "",
        imageUrl: "",
        recurrence: {
            frequency: "once",
            daysOfWeek: [],
            endDate: ""
        }
    });

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [editingEvent, setEditingEvent] = useState(null);
    const [previewMarker, setPreviewMarker] = useState(null);

    const [loadingMarkers, setLoadingMarkers] = useState(true);

    const handleEventSave = async (eventData, onUpdate) => {
        try {
            const eventRef = eventData.id
                ? doc(db, "events", eventData.id)
                : collection(db, "events");

            if (eventData.id) {
                await setDoc(doc(db, "events", eventData.id), eventData, { merge: true });
            } else {
                await addDoc(collection(db, "events"), eventData);
            }

            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Error saving event:", err);
        }
    };


    const [activeTab, setActiveTab] = useState('markers');
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    const fetchEvents = async () => {
        setLoadingEvents(true);
        try {
            const eventSnap = await getDocs(collection(db, "events"));
            const markerSnap = await getDocs(collection(db, "markers"));

            const markerMap = {};
            markerSnap.forEach((doc) => {
                markerMap[doc.id] = doc.data().name || "Unknown";
            });

            const fetchedEvents = eventSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    title: data.title,
                    date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
                    time: data.time,
                    locationName: markerMap[data.locationId] || "Unknown Location",
                    imageUrl: data.imageUrl || "",
                };
            });

            setEvents(fetchedEvents);
        } catch (err) {
            console.error("Error fetching events:", err);
        } finally {
            setLoadingEvents(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);


    const fetchMarkers = async () => {
        setLoadingMarkers(true);
        const querySnapshot = await getDocs(collection(db, 'markers'));
        const markersData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setMarkers(markersData);
        setLoadingMarkers(false);
    };
    useEffect(() => {
        fetchMarkers();
    }, []);


    const handleSubmit = async () => {
        const { name, latitude, longitude, address, description, entranceFee, openingHours } = form;

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

        const isTimeOverlap = Object.values(openingHours).some(({ open, close }) => open && close && open === close);
        if (isTimeOverlap) {
            setPopup({ message: 'Opening and closing times cannot be the same.', status: 'error' });
            return;
        }

        setLoading(true);
        const finalCategory = form.categoryOption === 'Other' ? form.customCategory : form.categoryOption;

        const newMarkerData = {
            ...form,
            id: editingId || Date.now(),
            category: finalCategory,
        };

        try {
            const docRef = doc(db, "markers", String(newMarkerData.id));
            await setDoc(docRef, newMarkerData);

            await fetchMarkers();

            setPopup({ message: isEditing ? 'Marker updated successfully!' : 'Marker added successfully!', status: 'success' });

            setForm(getEmptyForm());
            setIsModalOpen(false);
            setIsEditing(false);
            setEditingId(null);
        } catch (error) {
            console.error('Error saving marker: ', error);
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

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this marker?");
        if (!confirmDelete) return;

        setLoading(true);
        try {
            await deleteDoc(doc(db, 'markers', String(id)));
            setMarkers(prev => prev.filter(marker => marker.id !== id));
            setPopup({ message: 'Marker deleted successfully!', status: 'success' });
        } catch (error) {
            console.error('Error deleting marker: ', error);
            setPopup({ message: 'Error occurred while deleting the marker.', status: 'error' });
        } finally {
            setLoading(false);
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
        <>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonMarkerCard key={i} />
            ))}
        </>
    );

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <h2>Markers Management</h2>
                <div className="mtab-buttons">
                    <button
                        className={`mtab ${activeTab === 'markers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('markers')}
                    >
                        Manage Markers
                    </button>
                    <button
                        className={`mtab ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        Manage Events
                    </button>
                </div>


                {popup.message && (
                    <div className={`popup-message ${popup.status}`}>
                        {popup.message}
                    </div>
                )}

                {activeTab === 'markers' && (
                    <>
                        <div className="top-controls">
                            <input
                                type="text"
                                placeholder="Search markers or category..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <button onClick={handleAddMarkerClick}>Add New Marker</button>
                        </div>

                        <div className="markers-list">
                            {loadingMarkers ? (
                                <SkeletonMarkerList count={10} />
                            ) : (
                                filteredMarkers.map(marker => (
                                    <div key={marker.id} className="asset-card">
                                        <div className="asset-card-image-container">
                                            <img
                                                src={marker.image}
                                                alt={marker.name}
                                                onClick={() => setPreviewMarker(marker)}
                                                style={{ cursor: 'pointer' }}

                                            /></div>
                                        <h4>{marker.name}</h4>
                                        <p>{marker.category}</p>
                                        <div className="card-actions">
                                            <button onClick={() => handleEdit(marker)}>Edit</button>
                                            <button onClick={() => handleDelete(marker.id)}>Delete</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                    </>
                )}

                {activeTab === "events" && (
                    <>
                        <div className="top-controls">
                            <h3>Event Schedule</h3>
                            <button onClick={() => {
                                setSelectedDate(new Date());
                                setEditingEvent(null);
                                setIsEventModalOpen(true);
                            }}>
                                + Add Event
                            </button>

                        </div>

                        <div className="event-calendar-wrapper">
                            <EventCalendar
                                events={events}
                                onDateSelect={(date) => setSelectedDate(date)}
                                onEventClick={(event) => {
                                    setEventForm({
                                        ...event,
                                        recurrence: event.recurrence || { frequency: "once", daysOfWeek: [], endDate: "" }
                                    });
                                    setEditingEvent(event);
                                    setIsEventModalOpen(true);
                                }}

                            />
                        </div>
                        <EventFormModal
                            isOpen={isEventModalOpen}
                            formData={eventForm}
                            setFormData={setEventForm}
                            onUpdate={() => fetchEvents()}
                            onCancel={() => {
                                setEventForm({
                                    id: null,
                                    title: "",
                                    description: "",
                                    startDate: "",
                                    eventStartTime: "",
                                    eventEndTime: "",
                                    openToPublic: false,
                                    locationId: "",
                                    customAddress: "",
                                    imageUrl: "",
                                    recurrence: { frequency: "once", daysOfWeek: [], endDate: "" }
                                });
                                setIsEventModalOpen(false);
                                setEditingEvent(null);

                            }}
                        />

                    </>
                )}


                {
                    isModalOpen && (
                        <MarkerFormModal
                            form={form}
                            setForm={setForm}
                            onSubmit={handleSubmit}
                            onCancel={() => setIsModalOpen(false)}
                            loading={loading}
                            isEditing={isEditing}

                        />
                    )
                }

                <AdminMapTool />
            </main >
        </div >
    );
};

export default MarkersManagement;
