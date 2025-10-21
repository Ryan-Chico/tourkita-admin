import React, { useState, useEffect, useMemo } from 'react';
import './UserManagement.css';
import Sidebar from '../components/Sidebar';
import { collection, doc, getDoc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import ExportButtons from '../components/ExportButtons';

const UserManagement = () => {
    const [search, setSearch] = useState('');
    const [viewFilter, setViewFilter] = useState('all');
    const [allUsers, setAllUsers] = useState([]); // A single state to hold all user types
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);

    // State for column visibility, including new archived-specific columns
    const [columnVisibility, setColumnVisibility] = useState({
        userId: true,
        email: true,
        name: true,
        age: true,
        gender: true,
        contactNumber: true,
        status: true,
        activeStatus: true,
        userType: true,
        registeredDate: true,
        archivedDate: true, // New Column for archived view
        archiveReason: true, // New Column for archived view
        actions: true,
    });

    const handleToggleColumn = (col) => {
        setColumnVisibility(prev => ({ ...prev, [col]: !prev[col] }));
    };
    
    // Helper to format Firestore Timestamps or JavaScript Dates consistently
    const formatDate = (dateValue) => {
        if (!dateValue) return 'N/A';
        // Check if it's a Firestore Timestamp and convert, otherwise assume it's a JS Date object
        const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
        return date.toLocaleDateString();
    };

    // --- DATA FETCHING LOGIC ---
    useEffect(() => {
        setLoading(true);

        const usersRef = collection(db, 'users');
        const guestsRef = collection(db, 'guests');
        const archivedRef = collection(db, 'archived_users');

        // This function processes data from any of the collections and updates the main state
        const updateUsers = (snapshot, status) => {
            const fetchedUsers = snapshot.docs.map(doc => {
                const data = doc.data();
                const commonData = {
                    id: data.uid || data.guestId || doc.id,
                    email: data.email || '',
                    name: `${data.firstName || ''} ${data.middleInitial || ''} ${data.lastName || ''}`.trim(),
                    age: data.age || '',
                    gender: data.gender || '',
                    contactNumber: data.contactNumber || '',
                    userType: data.userType || '',
                };

                if (status === 'archived') {
                    return {
                        ...commonData,
                        status: 'archived',
                        activeStatus: false, // Archived users are always offline
                        registeredDate: formatDate(data.createdAt),
                        archivedDate: formatDate(data.archivedAt),
                        archiveReason: data.archiveReason || 'No reason provided.'
                    };
                }
                if (status === 'guest') {
                    return {
                        ...commonData,
                        name: 'Guest User',
                        email: '',
                        status: 'guest',
                        userType: 'Guest',
                        activeStatus: data.activeStatus ?? false,
                        registeredDate: formatDate(data.createdAt),
                    };
                }
                // Default case for 'registered' users
                return {
                    ...commonData,
                    status: 'registered',
                    activeStatus: data.activeStatus ?? false,
                    registeredDate: formatDate(data.createdAt),
                };
            });

            // Atomically update the state by replacing the relevant segment
            setAllUsers(currentUsers => {
                const otherUsers = currentUsers.filter(u => u.status !== status);
                return [...otherUsers, ...fetchedUsers];
            });
            setLoading(false);
        };

        const unsubRegistered = onSnapshot(usersRef, (snapshot) => updateUsers(snapshot, 'registered'));
        const unsubGuests = onSnapshot(guestsRef, (snapshot) => updateUsers(snapshot, 'guest'));
        const unsubArchived = onSnapshot(archivedRef, (snapshot) => updateUsers(snapshot, 'archived'));

        // Cleanup listeners when the component unmounts
        return () => {
            unsubRegistered();
            unsubGuests();
            unsubArchived();
        };
    }, []);

    const handleArchive = async (userId) => {
        const reason = prompt(`Please provide a reason for archiving user ${userId}:`);
        if (!reason || reason.trim() === '') {
            alert("Archive cancelled. A reason is required.");
            return;
        }

        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                alert('User not found. They may have already been archived or deleted.');
                return;
            }

            const userData = userSnap.data();
            
            // 1. Create a new record in the 'archived_users' collection
            await setDoc(doc(db, 'archived_users', userId), {
                ...userData,
                uid: userId, // Ensure UID is explicitly stored
                archivedAt: serverTimestamp(),
                archiveReason: reason,
            });

            // 2. Delete the original user record from the 'users' collection
            await deleteDoc(userRef);

            alert(`✅ User ${userData.email || userId} has been successfully archived.`);
        } catch (error) {
            console.error('Error archiving user:', error);
            alert('An error occurred while archiving the user. Please check the console for details.');
        }
    };

    // Use useMemo to efficiently filter users whenever the source data or filters change
    const filteredUsers = useMemo(() => {
        return allUsers.filter(user => {
            const matchesSearch = search === '' ||
                user.name?.toLowerCase().includes(search.toLowerCase()) ||
                user.email?.toLowerCase().includes(search.toLowerCase()) ||
                user.id.toLowerCase().includes(search.toLowerCase());

            const matchesView = 
                (viewFilter === 'all' && user.status !== 'archived') ||
                (user.status === viewFilter);

            return matchesSearch && matchesView;
        }).sort((a, b) => {
             // Sort by registration date, newest first
             const dateA = a.registeredDate !== 'N/A' ? new Date(a.registeredDate) : 0;
             const dateB = b.registeredDate !== 'N/A' ? new Date(b.registeredDate) : 0;
             return dateB - dateA;
        });
    }, [allUsers, search, viewFilter]);
    
    // Derived counts for the summary display at the top
    const totalUsers = allUsers.filter(u => u.status !== 'archived').length;
    const registeredCount = allUsers.filter(u => u.status === 'registered').length;
    const guestCount = allUsers.filter(u => u.status === 'guest').length;
    const archivedCount = allUsers.filter(u => u.status === 'archived').length;
    const onlineCount = allUsers.filter(u => u.status !== 'archived' && u.activeStatus).length;
    const offlineCount = totalUsers - onlineCount;

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <main className="dashboard-main">
                <h2>User Management</h2>
                <div className="main-content">
                    <div className="user-count-summary">
                         <div className="count-box"><span className="label">Total Active</span><span className="count">{totalUsers}</span></div>
                         <div className="count-box"><span className="label">Registered</span><span className="count">{registeredCount}</span></div>
                         <div className="count-box"><span className="label">Guests</span><span className="count">{guestCount}</span></div>
                         <div className="count-box"><span className="label">Archived</span><span className="count">{archivedCount}</span></div>
                         <div className="count-box online"><span className="label">Online</span><span className="count">{onlineCount}</span></div>
                         <div className="count-box offline"><span className="label">Offline</span><span className="count">{offlineCount}</span></div>
                    </div>

                    <div className="controls-bar">
                        <div className="tab-bar">
                            <button onClick={() => setViewFilter('all')} className={viewFilter === 'all' ? 'active' : ''}>All Users</button>
                            <button onClick={() => setViewFilter('registered')} className={viewFilter === 'registered' ? 'active' : ''}>Registered</button>
                            <button onClick={() => setViewFilter('guest')} className={viewFilter === 'guest' ? 'active' : ''}>Guests</button>
                            <button onClick={() => setViewFilter('archived')} className={viewFilter === 'archived' ? 'active' : ''}>Archived</button>
                        </div>
                        <input
                            type="text"
                            className="search-bar"
                            placeholder="Search by name, email or ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                         <div className="export-buttons-container">
                           <ExportButtons users={filteredUsers} columnVisibility={columnVisibility} />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="user-table">
                            <thead>
                                <tr>
                                    {columnVisibility.userId && <th>User ID</th>}
                                    {columnVisibility.email && <th>Email</th>}
                                    {columnVisibility.name && <th>Name</th>}
                                    {columnVisibility.status && <th>Type</th>}
                                    {columnVisibility.activeStatus && <th>Active Status</th>}
                                    {columnVisibility.registeredDate && <th>Registered Date</th>}
                                    {viewFilter === 'archived' && columnVisibility.archivedDate && <th>Archived Date</th>}
                                    {viewFilter === 'archived' && columnVisibility.archiveReason && <th>Archive Reason</th>}
                                    {columnVisibility.actions && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                      <tr key={i}>
                                        {Object.values(columnVisibility).map((isVisible, j) => 
                                            isVisible && <td key={j}><div className="skeleton skeleton-line"></div></td>
                                        )}
                                      </tr>
                                    ))
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            {columnVisibility.userId && <td data-label="User ID">{user.id}</td>}
                                            {columnVisibility.email && <td data-label="Email">{user.email || '—'}</td>}
                                            {columnVisibility.name && <td data-label="Name">{user.name || '—'}</td>}
                                            {columnVisibility.status && <td data-label="Type"><span className={`status-pill ${user.status}`}>{user.status}</span></td>}
                                            {columnVisibility.activeStatus && <td data-label="Active Status"><span className={`active-status ${user.activeStatus ? 'online' : 'offline'}`}>{user.activeStatus ? 'Online' : 'Offline'}</span></td>}
                                            {columnVisibility.registeredDate && <td data-label="Registered Date">{user.registeredDate}</td>}
                                            {viewFilter === 'archived' && columnVisibility.archivedDate && <td data-label="Archived Date">{user.archivedDate}</td>}
                                            {viewFilter === 'archived' && columnVisibility.archiveReason && <td data-label="Archive Reason">{user.archiveReason}</td>}
                                            {columnVisibility.actions && (
                                                <td data-label="Actions">
                                                    {user.status === 'registered' && (
                                                        <button className="archive-btn" onClick={() => handleArchive(user.id)}>Archive</button>
                                                    )}
                                                    {user.status === 'archived' && (
                                                        <span className="archived-text">Archived</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={Object.values(columnVisibility).filter(Boolean).length} className="no-data">
                                            No users found for the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserManagement;