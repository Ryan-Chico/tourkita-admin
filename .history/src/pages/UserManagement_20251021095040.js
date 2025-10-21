import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import Sidebar from '../components/Sidebar';
import { collection, doc, getDocs, onSnapshot, setDoc, deleteDoc, serverTimestamp, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import ExportButtons from '../components/ExportButtons';

// This function must be a server-side Cloud Function for security.
// The code here is for demonstration; you would call your function instead.
const deleteFirebaseUserAccount = async (uid) => {
    console.warn(`SECURITY WARNING: Deleting Firebase Auth user (${uid}) should be handled by a secure backend (e.g., a Cloud Function), not from the client.`);
    // Example of calling a Cloud Function:
    // const deleteUserFunction = httpsCallable(functions, 'deleteUser');
    // await deleteUserFunction({ uid });
    alert(`In a real app, a backend function would now delete Auth user: ${uid}.`);
};


const UserManagement = () => {
    const [search, setSearch] = useState('');
    const [viewFilter, setViewFilter] = useState('all');
    const [allUsers, setAllUsers] = useState([]); // A single state to hold all user types
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // Added columns for archived user data
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
        archivedDate: true, // New Column
        archiveReason: true, // New Column
        actions: true,
    });

    const handleToggleColumn = (col) => {
        setColumnVisibility(prev => ({ ...prev, [col]: !prev[col] }));
    };

    // Helper to format Firestore Timestamps or JS Dates consistently
    const formatDate = (dateValue) => {
        if (!dateValue) return 'N/A';
        const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
        return date.toLocaleDateString();
    };

    // --- DATA FETCHING & AUTO-DELETION ---
    useEffect(() => {
        setLoading(true);

        const usersRef = collection(db, 'users');
        const guestsRef = collection(db, 'guests');
        const archivedRef = collection(db, 'archived_users'); // Reference to archived collection

        // Listen to all three collections in real-time
        const unsubRegistered = onSnapshot(usersRef, (snapshot) => updateUsers(snapshot, 'registered'));
        const unsubGuests = onSnapshot(guestsRef, (snapshot) => updateUsers(snapshot, 'guest'));
        const unsubArchived = onSnapshot(archivedRef, (snapshot) => updateUsers(snapshot, 'archived'));

        // Function to update the main user list from any source
        const updateUsers = (snapshot, status) => {
            const fetchedUsers = snapshot.docs.map(doc => {
                const data = doc.data();
                if (status === 'archived') {
                    return {
                        id: data.uid || doc.id,
                        email: data.email || '',
                        name: `${data.firstName || ''} ${data.middleInitial || ''} ${data.lastName || ''}`.trim(),
                        age: data.age || '',
                        gender: data.gender || '',
                        contactNumber: data.contactNumber || '',
                        status: 'archived',
                        activeStatus: false, // Archived users are always offline
                        userType: data.userType || '',
                        registeredDate: formatDate(data.createdAt),
                        archivedDate: formatDate(data.archivedAt),
                        archiveReason: data.archiveReason || 'No reason provided.'
                    };
                }
                if (status === 'guest') {
                    return {
                        id: data.guestId || doc.id,
                        email: '', name: 'Guest User', age: '', gender: '', contactNumber: '',
                        status: 'guest',
                        activeStatus: data.activeStatus ?? false,
                        userType: 'Guest',
                        registeredDate: formatDate(data.createdAt),
                    };
                }
                // Default is 'registered'
                return {
                    id: data.uid || doc.id,
                    email: data.email || '',
                    name: `${data.firstName || ''} ${data.middleInitial || ''} ${data.lastName || ''}`.trim(),
                    age: data.age || '',
                    gender: data.gender || '',
                    contactNumber: data.contactNumber || '',
                    status: 'registered',
                    activeStatus: data.activeStatus ?? false,
                    userType: data.userType || '',
                    registeredDate: formatDate(data.createdAt),
                };
            });

            // Combine all user types into a single list
            setAllUsers(currentUsers => {
                const otherUsers = currentUsers.filter(u => u.status !== status);
                return [...otherUsers, ...fetchedUsers];
            });
            setLoading(false);
        };

        // --- AUTOMATIC 90-DAY DELETION LOGIC ---
        const autoDeleteOldArchives = async () => {
            const ninetyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
            const oldArchivesQuery = query(archivedRef, where("archivedAt", "<=", ninetyDaysAgo));

            try {
                const snapshot = await getDocs(oldArchivesQuery);
                if (snapshot.empty) {
                    console.log("No archived users older than 90 days found for deletion.");
                    return;
                }

                const deletionPromises = snapshot.docs.map(async (docSnapshot) => {
                    const userId = docSnapshot.id;
                    console.log(`User ${userId} was archived more than 90 days ago. Deleting...`);

                    // 1. Delete the record from Firestore 'archived_users' collection
                    await deleteDoc(doc(db, 'archived_users', userId));

                    // 2. Trigger the secure backend function to delete from Firebase Auth
                    await deleteFirebaseUserAccount(userId);
                });

                await Promise.all(deletionPromises);
                if (snapshot.docs.length > 0) {
                    alert(`✅ Automatically deleted ${snapshot.docs.length} user(s) who were archived for over 90 days.`);
                }
            } catch (error) {
                console.error("Error during automatic deletion of archived users:", error);
            }
        };

        autoDeleteOldArchives();

        // Cleanup listeners on component unmount
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
            const userSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));

            if (userSnap.empty) {
                alert('User not found in the database.');
                return;
            }

            const userDoc = userSnap.docs[0];
            const userData = userDoc.data();

            // Create a record in the 'archived_users' collection
            await setDoc(doc(db, 'archived_users', userId), {
                ...userData,
                uid: userId, // Ensure UID is stored
                archivedAt: serverTimestamp(),
                archiveReason: reason,
            });

            // Delete the original user record
            await deleteDoc(userDoc.ref);

            alert(`✅ User ${userData.email || userId} has been successfully archived.`);
        } catch (error) {
            console.error('Error archiving user:', error);
            alert('An error occurred while archiving the user. Please check the console.');
        }
    };

    const filteredUsers = React.useMemo(() => {
        return allUsers.filter(user => {
            const matchesSearch = search === '' ||
                user.name?.toLowerCase().includes(search.toLowerCase()) ||
                user.email?.toLowerCase().includes(search.toLowerCase()) ||
                user.id.toLowerCase().includes(search.toLowerCase());

            const matchesView =
                (viewFilter === 'all' && user.status !== 'archived') ||
                (viewFilter === 'archived' && user.status === 'archived') ||
                (user.status === viewFilter);

            const userRegDate = user.registeredDate !== 'N/A' ? new Date(user.registeredDate) : null;
            const matchesDateFrom = !dateFrom || (userRegDate && userRegDate >= new Date(dateFrom));
            const matchesDateTo = !dateTo || (userRegDate && userRegDate <= new Date(dateTo));

            return matchesSearch && matchesView && matchesDateFrom && matchesDateTo;
        }).sort((a, b) => {
            const dateA = a.registeredDate !== 'N/A' ? new Date(a.registeredDate) : 0;
            const dateB = b.registeredDate !== 'N/A' ? new Date(b.registeredDate) : 0;
            return dateB - dateA;
        });
    }, [allUsers, search, viewFilter, dateFrom, dateTo]);

    // --- DERIVED COUNTS FOR DISPLAY ---
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
                    {/* Summary Boxes */}
                    <div className="user-count-summary">
                        <div className="count-box"><span className="label">All Users</span><span className="count">{totalUsers}</span></div>
                        <div className="count-box"><span className="label">Registered</span><span className="count">{registeredCount}</span></div>
                        <div className="count-box"><span className="label">Guests</span><span className="count">{guestCount}</span></div>
                        <div className="count-box"><span className="label">Archived</span><span className="count">{archivedCount}</span></div>
                        <div className="count-box online"><span className="label">Online</span><span className="count">{onlineCount}</span></div>
                        <div className="count-box offline"><span className="label">Offline</span><span className="count">{offlineCount}</span></div>
                    </div>

                    {/* Filter and Control Bar */}
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

                    {/* User Table */}
                    <div className="table-responsive">
                        <table className="user-table">
                            <thead>
                                <tr>
                                    {columnVisibility.userId && <th>User ID</th>}
                                    {columnVisibility.email && <th>Email</th>}
                                    {columnVisibility.name && <th>Name</th>}
                                    {columnVisibility.age && <th>Age</th>}
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
                                            {[...Array(8)].map((_, j) => (
                                                <td key={j}><div className="skeleton skeleton-line"></div></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            {columnVisibility.userId && <td data-label="User ID">{user.id}</td>}
                                            {columnVisibility.email && <td data-label="Email">{user.email || '—'}</td>}
                                            {columnVisibility.name && <td data-label="Name">{user.name || '—'}</td>}
                                            {columnVisibility.age && <td data-label="Age">{user.age || '—'}</td>}
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
                                        <td colSpan="12" className="no-data">No users found for the selected filters.</td>
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