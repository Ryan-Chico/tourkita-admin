import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import TourkitaLogo from './TourkitaLogo.jpg';
import { FaSignOutAlt, FaUserCircle, FaMapMarkerAlt, FaTachometerAlt, FaUsers, FaComments, FaBell, FaChartBar, FaCamera, FaFileAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const groupedNav = [
    {
        title: 'Insights',
        items: [
            { to: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
            { to: '/analysis-report', icon: FaChartBar, label: 'Reports' }
        ]
    },
    {
        title: 'Management',
        items: [
            { to: '/user-management', icon: FaUsers, label: 'Users' },
            { to: '/feedback', icon: FaComments, label: 'Feedback' },
            { to: '/notification-management', icon: FaBell, label: 'Notifications' },
            { to: '/markers-management', icon: FaMapMarkerAlt, label: 'Markers' }
        ]
    },
    {
        title: 'Tools',
        items: [
            { to: '/ar-management', icon: FaCamera, label: 'AR Tools' },
            { to: '/content-management', icon: FaFileAlt, label: 'Content' }
        ]
    }
];

const Sidebar = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {/* Static admin info */}
                <div className="admin-info">
                    <FaUserCircle className="admin-icon" />
                    <span className="admin-name">Admin</span>
                </div>

                <nav className="nav-links">
                    {groupedNav.map((section) => (
                        <div key={section.title} className="nav-section">
                            <div className="nav-section-title">{section.title}</div>
                            {section.items.map(({ to, icon: Icon, label }) => (
                                <NavLink key={to} to={to} className="nav-link">
                                    <Icon className="nav-icon" />
                                    {label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <button onClick={handleLogout} className="logout-button">
                    <FaSignOutAlt className="logout-icon" />
                    Log Out
                </button>
            </div>

            <div className="logo-wrapper">
                <img src={TourkitaLogo} alt="Tour Kita Logo" className="app-logo" />
            </div>
        </aside>
    );
};

export default Sidebar;
