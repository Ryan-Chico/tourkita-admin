import React, { useEffect, useState } from "react";
import "./MarkerFormModal.css"; // The new CSS will apply to this
import { getDocs, collection, doc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import axios from "axios";
import LocationPickerMap from "./LocationPickerMap";

const CLOUDINARY_UPLOAD_PRESET = "Events image";
const CLOUDINARY_CLOUD_NAME = "dupjdmjha";

const EventFormModal = ({ isOpen, formData, setFormData, onCancel, onUpdate }) => {
    // --- ALL YOUR ORIGINAL STATE AND FUNCTIONS ARE UNCHANGED ---
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [locations, setLocations] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const formatTime = (time) => {
        if (!time) return "—";
        let [h, m] = time.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
    };

    const resetForm = () => {
        setFormData({ id: null, title: "", description: "", startDate: "", eventStartTime: "", eventEndTime: "", openToPublic: false, locationId: "", customAddress: "", lat: null, lng: null, imageUrl: "", recurrence: { frequency: "once", daysOfWeek: [], endDate: "" } });
        setImageFile(null);
    };

    useEffect(() => {
        const fetchMarkers = async () => {
            setLoadingLocations(true);
            try {
                const snapshot = await getDocs(collection(db, "markers"));
                const data = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
                setLocations(data);
            } catch (error) { console.error("Error fetching locations:", error); }
            finally { setLoadingLocations(false); }
        };
        if (isOpen) fetchMarkers();
    }, [isOpen]);

    const handleChange = e => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const handleRecurrenceChange = (key, value) => {
        setFormData(prev => ({ ...prev, recurrence: { ...prev.recurrence, [key]: value } }));
    };

    const toggleDayOfWeek = (day) => {
        setFormData(prev => {
            const days = prev.recurrence?.daysOfWeek || [];
            const updatedDays = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
            return { ...prev, recurrence: { ...prev.recurrence, daysOfWeek: updatedDays } };
        });
    };

    const handleImageUpload = async () => {
        if (!imageFile) return null;
        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append("file", imageFile);
        formDataUpload.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        try {
            const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, formDataUpload);
            return res.data.secure_url;
        } catch (err) {
            console.error("Image upload failed:", err);
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (submitting || uploading) return;
        try {
            setSubmitting(true);
            let imageUrl = formData.imageUrl || "";
            if (imageFile) {
                const uploadedUrl = await handleImageUpload();
                if (uploadedUrl) imageUrl = uploadedUrl;
            }
            const eventData = { title: formData.title, description: formData.description, startDate: formData.startDate, endDate: formData.recurrence?.frequency === "once" ? formData.startDate : formData.recurrence?.endDate, eventStartTime: formatTime(formData.eventStartTime), eventEndTime: formatTime(formData.eventEndTime), openToPublic: !!formData.openToPublic, locationId: formData.locationId || null, customAddress: formData.customAddress || "", lat: formData.lat || null, lng: formData.lng || null, imageUrl: imageUrl, recurrence: formData.recurrence || { frequency: "once" }, updatedAt: new Date() };
            if (formData.id) {
                const eventRef = doc(db, "events", formData.id);
                await updateDoc(eventRef, eventData);
                if (onUpdate) onUpdate({ ...formData, ...eventData, updatedAt: new Date() });
            } else {
                const newEventRef = await addDoc(collection(db, "events"), { ...eventData, createdAt: new Date() });
                if (onUpdate) onUpdate({ ...formData, id: newEventRef.id, ...eventData, createdAt: new Date() });
            }
            setImageFile(null);
            resetForm();
            onCancel();
        } catch (error) {
            console.error("Error saving event:", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;
    const isDisabled = loadingLocations || uploading || submitting;

    // --- NEW AND IMPROVED JSX FOR THE FORM ---
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{formData?.id ? "Edit Event" : "Add New Event"}</h2>
                </div>

                <form onSubmit={handleSubmit} className="marker-form">
                    <div className="form-grid">
                        <div className="field-group grid-col-span-2">
                            <label htmlFor="title">Event Title</label>
                            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} disabled={isDisabled} required />
                        </div>

                        <div className="field-group grid-col-span-2">
                            <label htmlFor="description">Description</label>
                            <textarea name="description" id="description" rows={3} value={formData.description} onChange={handleChange} disabled={isDisabled} required />
                        </div>

                        <div className="field-group">
                            <label htmlFor="recurrence">Recurrence</label>
                            <select id="recurrence" value={formData.recurrence?.frequency || "once"} onChange={e => handleRecurrenceChange("frequency", e.target.value)} disabled={isDisabled}>
                                <option value="once">Once</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>

                        {formData.recurrence?.frequency === "once" ? (
                            <div className="field-group">
                                <label htmlFor="startDate">Date</label>
                                <input type="date" name="startDate" id="startDate" value={formData.startDate || ""} onChange={handleChange} disabled={isDisabled} required />
                            </div>
                        ) : (
                            <>
                                <div className="field-group">
                                    <label htmlFor="startDate">Start Date</label>
                                    <input type="date" name="startDate" id="startDate" value={formData.startDate || ""} onChange={handleChange} disabled={isDisabled} required />
                                </div>
                                <div className="field-group">
                                    <label htmlFor="endDate">End Date</label>
                                    <input type="date" id="endDate" value={formData.recurrence?.endDate || ""} onChange={e => handleRecurrenceChange("endDate", e.target.value)} disabled={isDisabled} required />
                                </div>
                            </>
                        )}

                        <div className="field-group">
                            <label htmlFor="eventStartTime">Start Time</label>
                            <input type="time" name="eventStartTime" id="eventStartTime" value={formData.eventStartTime?.slice(0, 5) || ""} onChange={handleChange} required step={300} />
                        </div>

                        <div className="field-group">
                            <label htmlFor="eventEndTime">End Time</label>
                            <input type="time" name="eventEndTime" id="eventEndTime" value={formData.eventEndTime?.slice(0, 5) || ""} onChange={handleChange} required step={300} />
                        </div>

                        {formData.recurrence?.frequency === "weekly" && (
                            <div className="field-group grid-col-span-2">
                                <label>Days of the Week</label>
                                <div className="recurrence-days">
                                    {"sun,mon,tue,wed,thu,fri,sat".split(",").map(day => (
                                        <label key={day} className={`day-chip ${formData.recurrence?.daysOfWeek?.includes(day) ? 'active' : ''}`}>
                                            <input type="checkbox" checked={formData.recurrence?.daysOfWeek?.includes(day) || false} onChange={() => toggleDayOfWeek(day)} disabled={isDisabled} />
                                            {day.toUpperCase()}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="field-group grid-col-span-2">
                            <label htmlFor="locationId">Select a Location</label>
                            <select name="locationId" id="locationId" value={formData.locationId} onChange={handleChange} disabled={isDisabled || !!formData.customAddress}>
                                <option value="">-- Choose a Landmark --</option>
                                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>

                        <div className={`field-group grid-col-span-2 map-container ${formData.locationId ? 'disabled' : ''}`}>
                            <label>Or, pick a custom location on the map</label>
                            <LocationPickerMap onLocationSelect={({ lng, lat, address }) => { setFormData(prev => ({ ...prev, locationId: "", customAddress: address, lat, lng })); }} />
                            {formData.customAddress && <p className="selected-address">📍 {formData.customAddress}</p>}
                        </div>

                        <div className="field-group">
                            <label htmlFor="image-upload">Upload an Image</label>
                            <input type="file" id="image-upload" accept="image/*" onChange={e => setImageFile(e.target.files[0])} disabled={isDisabled} />
                        </div>
                        <div className="field-group">
                            <label htmlFor="imageUrl">Or paste Image URL</label>
                            <input type="url" name="imageUrl" id="imageUrl" value={formData.imageUrl || ""} onChange={handleChange} placeholder="https://example.com/image.jpg" disabled={isDisabled} />
                        </div>

                        <div className="field-group toggle-group grid-col-span-2">
                            <label>Open to the Public?</label>
                            <label className="toggle-switch">
                                <input type="checkbox" name="openToPublic" checked={formData.openToPublic || false} onChange={handleChange} disabled={isDisabled} />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onCancel} disabled={isDisabled}>Cancel</button>
                        <button type="submit" className="save-btn" disabled={isDisabled}>
                            {uploading ? "Uploading..." : submitting ? "Saving..." : formData?.id ? "Update Event" : "Save Event"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventFormModal;