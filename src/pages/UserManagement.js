import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import Sidebar from '../components/Sidebar';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import ExportButtons from '../components/ExportButtons';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const UserManagement = () => {
    const [search, setSearch] = useState('');
    const [viewFilter, setViewFilter] = useState('all');
    const [statusFilter] = useState('all');
    const [users, setUsers] = useState([]);
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

    const onlineOfflineFiltered = users.filter(u =>
        u.status !== 'archived' &&
        (statusFilter === 'all' || u.status === statusFilter)
    );

    const onlineCount = onlineOfflineFiltered.filter(u => u.activestatus).length;
    const offlineCount = onlineOfflineFiltered.filter(u => !u.activestatus).length;
    const onlineGuestCount = users.filter(u => u.status === 'guest' && u.activestatus).length;
    const offlineGuestCount = users.filter(u => u.status === 'guest' && !u.activestatus).length;

    const getStatusColor = (activestatus) => activestatus ? 'green' : 'red';

    // 📊 User Type Pie Chart Data
    const userTypeCounts = [
        { name: 'Tourist', value: users.filter(u => u.userType === 'Tourist').length },
        { name: 'Student', value: users.filter(u => u.userType === 'Student').length },
        { name: 'Local', value: users.filter(u => u.userType === 'Local').length },
        { name: 'Foreign National', value: users.filter(u => u.userType === 'Foreign National').length },
        { name: 'Researcher', value: users.filter(u => u.userType === 'Researcher').length },
    ];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

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
                                <div className="count-box"><span className="label">All Users</span><span className="count">{totalUsers}</span></div>
                                <div className="count-box"><span className="label">Registered</span><span className="count">{registeredCount}</span></div>
                                <div className="count-box"><span className="label">Guests</span><span className="count">{guestCount}</span></div>
                                <div className="count-box"><span className="label">Archived</span><span className="count">{archivedCount}</span></div>
                                <div className="count-box"><span className="label">Online Users</span><span className="count">{onlineCount}</span></div>
                                <div className="count-box"><span className="label">Offline Users</span><span className="count">{offlineCount}</span></div>
                                <div className="count-box"><span className="label">Online Guests</span><span className="count">{onlineGuestCount}</span></div>
                                <div className="count-box"><span className="label">Offline Guests</span><span className="count">{offlineGuestCount}</span></div>
                            </div>
                        )}
                    </div>

                    {/* 🥧 User Type Pie Chart Section */}
                    <div className="user-type-chart">
                        <h3>User Type Distribution</h3>
                        {loading ? (
                            <div className="skeleton skeleton-line" style={{ height: '250px', width: '100%' }}></div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={userTypeCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {userTypeCounts.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* 🔽 Table Section */}
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
