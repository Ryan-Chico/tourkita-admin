import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import Sidebar from '../components/Sidebar';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import ExportButtons from '../components/ExportButtons';

const SkeletonTableRow = ({ columns }) => (
    <tr>
        {Array.from({ length: columns }).map((_, index) => (
            <td key={index}>
                <div className="skeleton skeleton-line"></div>
            </td>
        ))}
    </tr>
);
const UserManagement = () => {
    const [search, setSearch] = useState('');
    const [viewFilter, setViewFilter] = useState('all');
    const [statusFilter] = useState('all');
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

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
        actions: true,
    });

    const handleToggleColumn = (col) => {
        setColumnVisibility(prev => ({
            ...prev,
            [col]: !prev[col],
        }));
    };

    useEffect(() => {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const guestsRef = collection(db, 'guests');
        const archivedRef = collection(db, 'archived_users');

        const updateState = (snapshot, status) => {
            +       const fetchedData = snapshot.docs.map(doc => {
                +           const data = doc.data();
                +           // ... (your existing mapping logic for registered/guest users)
                    +
                    +           // Add logic for processing archived users
                    +           if (status === 'archived') {
                        +               return {
+ id: data.uid || doc.id,
                            +                   email: data.email || '',
                                +                   name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                                    +                   // ... other user fields
                                    +                   status: 'archived',
                                        +                   activeStatus: false, // Archived users are always offline
                                            +                   registeredDate: data.createdAt?.toDate().toLocaleDateString() || 'N/A',
                                                +                   archivedDate: data.archivedAt?.toDate().toLocaleDateString() || 'N/A',
                                                    +                   archiveReason: data.archiveReason || 'No reason provided.'
                                                        +               };
                +           }
+           // Return registered or guest user object here
                +       });
    +
        +       // Combine all user types into the single allUsers state
        +       setAllUsers(currentData => {
            +           const otherData = currentData.filter(u => u.status !== status);
            +           return [...otherData, ...fetchedData];
            +       });
    +       setLoading(false);
       };
const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
    const registeredUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: data.uid || doc.id,
            email: data.email || '',
            name: `${data.firstName || ''} ${data.middleInitial || ''} ${data.lastName || ''}`.trim(),
            age: data.age || '',
            gender: data.gender || '',
            contactNumber: data.contactNumber || '',
            status: 'registered',
            activestatus: data.activeStatus ?? false,
            userType: data.userType || '',
            registeredDate: data.createdAt
                ? new Date(data.createdAt.toDate?.() || data.createdAt).toLocaleDateString()
                : 'N/A',
        };
    });

    const unsubscribeGuests = onSnapshot(guestsRef, (guestSnap) => {
        const guestUsers = guestSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.guestId || doc.id,
                email: '',
                name: 'Guest User',
                age: '',
                gender: '',
                contactNumber: '',
                status: 'guest',
                activestatus: data.activeStatus ?? false,
                userType: 'Guest',
                registeredDate: data.createdAt
                    ? new Date(data.createdAt.toDate?.() || data.createdAt)
                    : null,
            };
        });

        setUsers([...registeredUsers, ...guestUsers]);
        setLoading(false);
    });

    return () => unsubscribeGuests();
});

return () => unsubscribeUsers();
    }, []);

const handleArchive = async (userId, reason) => {
    if (!reason) return;

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            alert('User not found.');
            return;
        }

        const userData = userSnap.data();

        const archivedUserRef = doc(db, 'archived_users', userId);
        await setDoc(archivedUserRef, {
            ...userData,
            email: userData.email || '',
            uid: userId,
            archivedAt: serverTimestamp(),
            archiveReason: reason,
        });

        await deleteDoc(userRef);

        const updatedUsers = users.map(user =>
            user.id === userId ? { ...user, status: 'archived' } : user
        );
        setUsers(updatedUsers);

        alert(`✅ User ${userData.email || userId} has been archived.`);
    } catch (error) {
        console.error('Error archiving user:', error);
        alert('Error archiving user. See console for details.');
    }
};

const handleWarnAndArchive = (userId) => {
    const reason = prompt(`Enter a reason to archive User ID: ${userId}`);
    if (reason) {
        handleArchive(userId, reason);
    }
};

const filterUsers = () => {
    return users.filter(user => {
        const matchesSearch =
            (user.name?.toLowerCase().includes(search.toLowerCase()) || false) ||
            (user.email?.toLowerCase().includes(search.toLowerCase()) || false) ||
            user.id.toLowerCase().includes(search.toLowerCase());

        const matchesFilter =
            viewFilter === 'all'
                ? user.status !== 'archived'
                : viewFilter === 'archived'
                    ? user.status === 'archived'
                    : user.status === viewFilter;

        const matchesDateFrom = dateFrom ? new Date(user.registeredDate) >= new Date(dateFrom) : true;
        const matchesDateTo = dateTo ? new Date(user.registeredDate) <= new Date(dateTo) : true;

        return matchesSearch && matchesFilter && matchesDateFrom && matchesDateTo;
    }).sort((a, b) => new Date(b.registeredDate) - new Date(a.registeredDate));
};

const countByStatus = (statusType) => users.filter(u => u.status === statusType).length;
const totalUsers = users.filter(u => u.status !== 'archived').length;
const registeredCount = countByStatus('registered');
const guestCount = countByStatus('guest');
const archivedCount = countByStatus('archived');

const filteredUsers = filterUsers();

const countOnlineOffline = () => {
    return users.filter(u =>
        u.status !== 'archived' &&
        (statusFilter === 'all' || u.status === statusFilter)
    );
};

const onlineOfflineFiltered = countOnlineOffline();
const onlineCount = onlineOfflineFiltered.filter(u => u.activestatus).length;
const offlineCount = onlineOfflineFiltered.filter(u => !u.activestatus).length;
const onlineGuestCount = users.filter(u => u.status === 'guest' && u.activestatus).length;
const offlineGuestCount = users.filter(u => u.status === 'guest' && !u.activestatus).length;

const getStatusColor = (activestatus) => {
    return activestatus ? 'green' : 'red';
};

return (
    <div className="dashboard-wrapper">
        <Sidebar />
        <main className="dashboard-main">
            <h2>User Management</h2>

            <div className="main-content">
                <div className="summary-row">
                    {loading ? (
                        <div className="user-count-summary">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="count-box skeleton"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="user-count-summary">
                            <div className="count-box">
                                <span className="label">All Users</span>
                                <span className="count">{totalUsers}</span>
                            </div>
                            <div className="count-box">
                                <span className="label">Registered</span>
                                <span className="count">{registeredCount}</span>
                            </div>
                            <div className="count-box">
                                <span className="label">Guests</span>
                                <span className="count">{guestCount}</span>
                            </div>
                            <div className="count-box">
                                <span className="label">Archived</span>
                                <span className="count">{archivedCount}</span>
                            </div>

                            <div className="count-box">
                                <span className="label">Online Users</span>
                                <span className="count">{onlineCount}</span>
                            </div>
                            <div className="count-box">
                                <span className="label">Offline Users</span>
                                <span className="count">{offlineCount}</span>
                            </div>
                            <div className="count-box">
                                <span className="label">Online Guests</span>
                                <span className="count">{onlineGuestCount}</span>
                            </div>
                            <div className="count-box">
                                <span className="label">Offline Guests</span>
                                <span className="count">{offlineGuestCount}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="online-status-summary">
                    <h3>User Online Status</h3>
                    {loading ? (
                        <div className="status-counts">
                            <div className="count-box skeleton"></div>
                            <div className="count-box skeleton"></div>
                        </div>
                    ) : (
                        <div className="status-counts">
                            <div className="count-box"><span className="label">Online</span><span className="count">{onlineCount}</span></div>
                            <div className="count-box"><span className="label">Offline</span><span className="count">{offlineCount}</span></div>
                        </div>
                    )}
                </div>

                <div className="tab-date-row">
                    <div className="tab-bar markers-tabs">
                        {['all', 'registered', 'archived'].map(tab => (
                            <button
                                key={tab}
                                className={`mtab ${viewFilter === tab ? 'active' : ''}`}
                                onClick={() => setViewFilter(tab)}
                            >
                                {tab === 'all' ? 'All Users' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                        <div className="top-row">
                            <div className="column-dropdown">
                                <button
                                    className="dropdown-btn"
                                    onClick={() => setShowDropdown(prev => !prev)}
                                >
                                    Columns ▼
                                </button>
                                {showDropdown && (
                                    <div className="dropdown-content">
                                        {Object.keys(columnVisibility).map(col => (
                                            <label key={col} className="dropdown-item">
                                                <input
                                                    type="checkbox"
                                                    checked={columnVisibility[col]}
                                                    onChange={() => handleToggleColumn(col)}
                                                />
                                                {col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="date-filters">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="date-filter"
                                />
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="date-filter"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bottom-row">
                        <input
                            type="text"
                            className="search-bar"
                            placeholder="Search by name, email or ID"
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
                                    {columnVisibility.age && <th>Age</th>}
                                    {columnVisibility.gender && <th>Gender</th>}
                                    {columnVisibility.contactNumber && <th>Contact Number</th>}
                                    {columnVisibility.status && <th>Status</th>}
                                    {columnVisibility.activeStatus && <th>Active Status</th>}
                                    {columnVisibility.userType && <th>User Type</th>}
                                    {columnVisibility.registeredDate && <th>Registered Date</th>}
                                    {columnVisibility.actions && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i}>
                                            {[...Array(11)].map((_, j) => (
                                                <td key={j}><div className="skeleton skeleton-line"></div></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id}>
                                                {columnVisibility.userId && <td>{user.id}</td>}
                                                {columnVisibility.email && <td>{user.email || '—'}</td>}
                                                {columnVisibility.name && <td>{user.name || '—'}</td>}
                                                {columnVisibility.age && <td>{user.age > 0 ? user.age : 'N/A'}</td>}
                                                {columnVisibility.gender && <td>{user.gender || '—'}</td>}
                                                {columnVisibility.contactNumber && <td>{user.contactNumber || '—'}</td>}
                                                {columnVisibility.status && <td>{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</td>}
                                                {columnVisibility.activeStatus && (
                                                    <td>
                                                        <span style={{ color: getStatusColor(user.activestatus) }}>
                                                            {user.activestatus ? 'Online' : 'Offline'}
                                                        </span>
                                                    </td>
                                                )}
                                                {columnVisibility.userType && <td>{user.status === 'registered' ? user.userType || 'N/A' : '—'}</td>}
                                                {columnVisibility.registeredDate && <td>{user.registeredDate ? new Date(user.registeredDate).toLocaleDateString() : 'N/A'}</td>}
                                                {columnVisibility.actions && (
                                                    <td>
                                                        {user.status === 'registered' && (
                                                            <button className="archive-btn" onClick={() => handleWarnAndArchive(user.id)}>Archive</button>
                                                        )}
                                                        {user.status === 'archived' && (
                                                            <button className="archived-btn" disabled>Archived</button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="11" className="no-data">No users found.</td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>
);
};

export default UserManagement;
