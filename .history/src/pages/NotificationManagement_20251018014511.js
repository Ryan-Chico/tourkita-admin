import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import './NotificationManagement.css';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import NotificationModal from '../components/NotificationModal';
import NotificationDetailsModal from '../components/NotificationDetailsModal';

const categoryIcons = {
    updates: '🔔',QZ
    promotions: '🎉',
    reminders: '⏰',
    alerts: '⚠️',
};

const SkeletonCard = () => (
    <li className="notification-item skeleton-card">
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-line"></div>
        <div className="skeleton skeleton-line medium"></div>
        <div className="skeleton skeleton-line short"></div>
    </li>
);

const SkeletonList = ({ count = 3 }) => (
    <>
        {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </>
);

const NotificationManagement = () => {
    const [notifications, setNotifications] = useState([]);
    const [adminReplies, setAdminReplies] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(true);
    const [loadingReplies, setLoadingReplies] = useState(true);
    const [activeTab, setActiveTab] = useState('notifications');
    const [searchTerm, setSearchTerm] = useState('');
    const [popupVisible, setPopupVisible] = useState(false);
    const [editingNotif, setEditingNotif] = useState(null);
    const [modalImageUrl, setModalImageUrl] = useState(null);

    const [selectedNotif, setSelectedNotif] = useState(null);

    const fetchCollection = async (colName, setData, setLoading, timestampField) => {
        setLoading(true);
        const snapshot = await getDocs(collection(db, colName));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => b[timestampField]?.toDate?.() - a[timestampField]?.toDate?.());
        setData(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCollection('notifications', setNotifications, setLoadingNotifs, 'timestamp');
        fetchCollection('adminMessages', setAdminReplies, setLoadingReplies, 'sentAt');
    }, []);

    const handleDelete = async (id, type) => {
        const colName = type === 'notification' ? 'notifications' : 'adminMessages';
        try {
            await deleteDoc(doc(db, colName, id));
            type === 'notification'
                ? setNotifications(prev => prev.filter(n => n.id !== id))
                : setAdminReplies(prev => prev.filter(r => r.id !== id));
            alert(`${type === 'notification' ? 'Notification' : 'Reply'} deleted successfully!`);
        } catch (error) {
            console.error(error);
            alert('Failed to delete.');
        }
    };

    const filterList = (list, searchField, dateField) => {
        const search = searchTerm.toLowerCase();
        return list.filter(item => {
            const dateStr = item[dateField]?.toDate?.().toLocaleString() || '';
            return (
                item[searchField]?.toLowerCase().includes(search) ||
                item.message?.toLowerCase().includes(search) ||
                dateStr.toLowerCase().includes(search)
            );
        });
    };

    const renderNotificationItem = (notif) => {
        const dateSent = notif.timestamp?.toDate?.().toLocaleString() || 'Unknown Date';
        const icon = categoryIcons[notif.category] || '📢';
        const audience = notif.audience || 'All';
        const scheduleDate = notif.schedule?.toDate?.() || notif.schedule;

        return (
            <li
                key={notif.id}
                className="notification-item"
                onClick={() => setSelectedNotif(notif)}
            >
                <div className="notif-image">
                    {notif.imageUrl ? (
                        <img
                            src={notif.imageUrl}
                            alt="notification"
                            className="notif-thumbnail"
                            onClick={(e) => { e.stopPropagation(); setModalImageUrl(notif.imageUrl); }}
                        />
                    ) : (
                        <div className="icon-placeholder">{icon}</div>
                    )}
                </div>
                <div className="notif-details">
                    <strong>{notif.title}</strong>
                    <div className="notif-message">
                        {notif.message?.split("\n").map((line, index) => (
                            line.trim() && (
                                <p key={index} className="notif-paragraph">
                                    {line}
                                </p>
                            )
                        ))}
                    </div>

                    <small>Audience: {audience}</small>
                    <small>Category: {notif.category || 'General'}</small>
                    <small>Created: {dateSent}</small>
                    {scheduleDate && !isNaN(new Date(scheduleDate).getTime()) && (
                        <small>Scheduled at: {new Date(scheduleDate).toLocaleString()}</small>
                    )}
                </div>
                <div className="notif-actions">
                    <button className="edits-btn" onClick={(e) => { e.stopPropagation(); setEditingNotif(notif); }}>Edit</button>
                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(notif.id, 'notification'); }}>Delete</button>
                </div>
            </li>

        );
    };

    const renderReplyItem = (reply) => {
        const sentDate = reply.sentAt?.toDate?.().toLocaleString() || 'Unknown Date';
        return (
            <li key={reply.id} className="notification-item">
                <div className="notif-image">
                    <div className="icon-placeholder">💬</div>
                </div>
                <div className="notif-details">
                    <strong>{reply.to ? `To: ${reply.to}` : 'Reply Sent'}</strong>
                    <p>{reply.message}</p>
                    <small>{sentDate}</small>
                </div>
                <div className="notif-actions">
                    <button className="delete-btn" onClick={() => handleDelete(reply.id, 'reply')}>Delete</button>
                </div>
            </li>
        );
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <div className="dashboard-header">
                    <h2>Notification Management</h2>
                </div>

                <div className="notif-header-row">
                    <div className="ntab-buttons">
                        <button
                            className={`ntab ${activeTab === 'notifications' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('notifications'); setSearchTerm(''); }}
                        >
                            Notifications
                        </button>
                        <button
                            className={`ntab ${activeTab === 'feedback' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('feedback'); setSearchTerm(''); }}
                        >
                            Feedback Replies
                        </button>
                    </div>
                    <div className="notif-top-controls">
                        {activeTab === 'notifications' && (
                            <button className="notif-top-controls-button" onClick={() => setPopupVisible(true)}>
                                + New Notification
                            </button>
                        )}
                    </div>
                </div>

                <input
                    type="text"
                    className="search-bar"
                    placeholder={`Search ${activeTab === 'notifications' ? 'notifications' : 'feedback replies'}...`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />

                <ul className="notification-list">
                    {activeTab === 'notifications'
                        ? loadingNotifs ? <SkeletonList count={4} /> : filterList(notifications, 'title', 'timestamp').map(renderNotificationItem)
                        : loadingReplies ? <SkeletonList count={3} /> : filterList(adminReplies, 'to', 'sentAt').map(renderReplyItem)
                    }
                </ul>

                <NotificationModal
                    isOpen={popupVisible || editingNotif !== null}
                    onClose={() => { setPopupVisible(false); setEditingNotif(null); }}
                    onSaved={() => fetchCollection('notifications', setNotifications, setLoadingNotifs, 'timestamp')}
                    editingData={editingNotif}
                />

                {modalImageUrl && (
                    <div className="modal-overlay" onClick={() => setModalImageUrl(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <img src={modalImageUrl} alt="Full view" className="modal-image" />
                            <button onClick={() => setModalImageUrl(null)} className="ok-button">OK</button>
                        </div>
                    </div>
                )}
            </main>

            <NotificationDetailsModal
                notif={selectedNotif}
                onClose={() => setSelectedNotif(null)}
                onEdit={(notif) => {
                    setEditingNotif(notif);
                    setSelectedNotif(null);
                }}
                onDelete={async (notif) => {
                    await handleDelete(notif.id, 'notification');
                    setSelectedNotif(null);
                }}
            />

        </div>
    );
};

export default NotificationManagement;
